/**
 * Built with React ECS.
 */
import ReactEcs, { ReactEcsRenderer, UiEntity, Label, Button, ScreenInsetArea } from '@dcl/sdk/react-ecs'
import { Color4 } from '@dcl/sdk/math'
import { engine, Transform } from '@dcl/sdk/ecs'
import { isMobile } from '../platform'
import {
  switchExperience,
  getCurrentExperience,
  isSwitching,
  ExperienceKind,
} from '../experience-manager'

import { createGameArea, getCurrentGems } from '../experience-manager/runner/gameArea'
import { getCurrentLevel, getFormattedElapsedTime, getRootEntity, getUnlockedMaps, setCurrentLevel } from '../experience-manager/runner/gameState'
import { Gem } from '../experience-manager/runner/gem'
import { getGemCountByType } from '../experience-manager/runner/inventory'
import { maps } from '../experience-manager/runner/maps'
import { sendResetHealth } from '../client/connection'
import { getCenterMessage } from './centerMessage'
import { getDamageFlashAlpha } from './damageIndicator'
import { UiTransformProps } from '@dcl/sdk/react-ecs'



let visibleInventory: boolean = false
let visibleLevelSelect: boolean = false
let visibleQuest: boolean = false

export function changeSidebarUI(state: number):void{
  console.log("changeSidebarUI")
  console.log(state)

  switch (state) {
    case 1:
      if(visibleInventory){
        visibleInventory = false
        visibleLevelSelect = false
        visibleQuest = false
      } else {
        visibleInventory = true
        visibleLevelSelect = false
        visibleQuest = false
      }
      break 
    case 2:
      if(visibleLevelSelect){
        visibleInventory = false
        visibleLevelSelect = false
        visibleQuest = false
      } else {
        visibleInventory = false
        visibleLevelSelect = true
        visibleQuest = false
      }
      break
    case 3:
      if(visibleQuest){
        visibleInventory = false
        visibleLevelSelect = false
        visibleQuest = false
      } else {
        visibleInventory = false
        visibleLevelSelect = false
        visibleQuest = true
      }
      break                        
    default:
      break
  }
}

let healthPercentage: number = 100

export function changeHealthPercent(val: number):void{
  console.log("changeHealthPercent")
  healthPercentage = val
}

// Player's persistent collected gem totals, shown in the inventory panel.
let resourceCounts = { gem1: 0, gem2: 0, gem3: 0, gem4: 0 }

export function setResourceCounts(counts: { gem1: number; gem2: number; gem3: number; gem4: number }): void {
  resourceCounts = counts
}

/** How many map slots the level selector shows (some are placeholders for now). */
const LEVEL_SLOTS = 10

/** Thickness of the damage-indicator border, as a percentage of the screen. */
const DAMAGE_BORDER_PCT = 4

/** How many strips make up each border edge. More = smoother gradient, at one
 * UI entity per strip per edge. */
const DAMAGE_GRADIENT_STEPS = 10

/**
 * Builds one edge of the damage border as a stack of strips running from the
 * screen edge inward, each weaker than the last so the inner lip fades out
 * (DCL's uiBackground takes a flat colour, so a stepped ramp stands in for a
 * gradient — invisible as banding at these alphas).
 *
 * The left/right edges are inset vertically by the border thickness so they stop
 * short of the top/bottom edges. Without that the strips overlap in the four
 * corners and their alphas compound, painting the corners noticeably darker.
 */
function damageBorderEdge(edge: 'top' | 'bottom' | 'left' | 'right', alpha: number) {
  const stripSize = DAMAGE_BORDER_PCT / DAMAGE_GRADIENT_STEPS
  // Percentages are template-literal types (PositionUnit), so the computed
  // values need that shape rather than a plain string.
  const sideHeight: `${number}%` = `${100 - DAMAGE_BORDER_PCT * 2}%`
  const sideTop: `${number}%` = `${DAMAGE_BORDER_PCT}%`

  const strips = []
  for (let i = 0; i < DAMAGE_GRADIENT_STEPS; i++) {
    // Outermost strip carries the full alpha; each step inward is weaker, and
    // the innermost lands just above zero.
    const color = Color4.create(1, 0, 0, alpha * (1 - i / DAMAGE_GRADIENT_STEPS))
    const offset: `${number}%` = `${i * stripSize}%`
    const thickness: `${number}%` = `${stripSize}%`

    const transform: UiTransformProps =
      edge === 'top'
        ? { positionType: 'absolute', width: '100%', height: thickness, position: { top: offset, left: '0%' } }
        : edge === 'bottom'
        ? { positionType: 'absolute', width: '100%', height: thickness, position: { bottom: offset, left: '0%' } }
        : edge === 'left'
        ? { positionType: 'absolute', width: thickness, height: sideHeight, position: { left: offset, top: sideTop } }
        : { positionType: 'absolute', width: thickness, height: sideHeight, position: { right: offset, top: sideTop } }

    strips.push(<UiEntity key={`damage-${edge}-${i}`} uiTransform={transform} uiBackground={{ color }} />)
  }
  return strips
}

/** Tiered button background per map number. */
function levelButtonImage(mapNumber: number): string {
  if (mapNumber === 1) return 'images/button1.png'
  if (mapNumber === 2 || mapNumber === 3) return 'images/button2.png'
  if (mapNumber === 4 || mapNumber === 5) return 'images/button3.png'
  return 'images/button4.png' // maps 6-10
}


const mainUIComponent = () => {
const mobile = isMobile()
const inRunner = getCurrentExperience() === 'runner'

const inventoryTransform: UiTransformProps = mobile
  ? {
      display: 'flex',
      positionType: 'absolute',
      width: '7%',
      height: '175%',
      position: { top: '30%', right: '15%' },
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignSelf: 'center'
    }
  : {
      display:'flex',
      positionType: 'absolute'  ,
      width: '5%',
      height: '125%',
      position: { top: '110%', right: '1%' } ,
      flexDirection:'row',
      flexWrap:'wrap',
      alignSelf:'center'
    }

const domeTransform: UiTransformProps = mobile
  ? {
      display:'flex',
      positionType: 'absolute'  ,
      width: '7%',
      height: '175%',
      position: { top: '200%', right: '1%' } ,
      flexDirection:'row',
      flexWrap:'wrap',
      alignSelf:'center'
    }
  : {
      display:'flex',
      positionType: 'absolute'  ,
      width: '5%',
      height: '125%',
      position: { top: '230%', right: '1%' } ,
      flexDirection:'row',
      flexWrap:'wrap',
      alignSelf:'center'
    }

    const parkourTransform: UiTransformProps = mobile
  ? {
      display:'flex',
      positionType: 'absolute'  ,
      width: '7%',
      height: '175%',
      position: { top: '370%', right: '1%' } ,
      flexDirection:'row',
      flexWrap:'wrap',
      alignSelf:'center'
    }
  : {
      display:'flex',
      positionType: 'absolute'  ,
      width: '5%',
      height: '125%',
      position: { top: '350%', right: '1%' } ,
      flexDirection:'row',
      flexWrap:'wrap',
      alignSelf:'center'
    }

  const questionTransform: UiTransformProps = mobile
  ? {
      display:'flex',
      positionType: 'absolute'  ,
      width: '7%',
      height: '175%',
      position: { top: '30%', right: '23%' } ,
      flexDirection:'row',
      flexWrap:'wrap',
      alignSelf:'center'
    }
  : {
      display:'flex',
      positionType: 'absolute'  ,
      width: '5%',
      height: '125%',
      position: { top: '590%', right: '1%' } ,
      flexDirection:'row',
      flexWrap:'wrap',
      alignSelf:'center'
    }

const inventoryOpenTransform: UiTransformProps = mobile
  ? {
      display: visibleInventory ? 'flex':'none',
      positionType: 'absolute'  ,
      width: '19%',
      height: '600%',
      position: { top: '200%', right: '9%' } ,
      flexDirection:'row',
      flexWrap:'wrap',
      alignSelf:'center'
    }
  : {
      display: visibleInventory ? 'flex':'none',
      positionType: 'absolute'  ,
      width: '19%',
      height: '600%',
      position: { top: '110%', right: '6%' } ,
      flexDirection:'row',
      flexWrap:'wrap',
      alignSelf:'center'
    }

// Level selector panel — same size/position as the inventory panel.
const levelSelectOpenTransform: UiTransformProps = mobile
  ? {
      display: visibleLevelSelect ? 'flex':'none',
      positionType: 'absolute'  ,
      width: '19%',
      height: '600%',
      position: { top: '200%', right: '9%' } ,
      flexDirection:'row',
      flexWrap:'wrap',
      alignSelf:'center'
    }
  : {
      display: visibleLevelSelect ? 'flex':'none',
      positionType: 'absolute'  ,
      width: '19%',
      height: '600%',
      position: { top: '110%', right: '6%' } ,
      flexDirection:'row',
      flexWrap:'wrap',
      alignSelf:'center'
    }

const inventoryOpenGem1Transform: UiTransformProps = mobile
  ? {
      positionType: 'absolute',
      width: '30%',
      height: '8%',
      position: { left: '18%', top: '44.5%' },
      justifyContent: 'center',
      alignItems: 'center'
    }
  : {
      positionType: 'absolute',
      width: '30%',
      height: '8%',
      position: { left: '18%', top: '45.25%' },
      justifyContent: 'center',
      alignItems: 'center'
    }

const inventoryOpenGem2Transform: UiTransformProps = mobile
  ? {
      positionType: 'absolute',
      width: '30%',
      height: '8%',
      position: { left: '54%', top: '44.5%' },
      justifyContent: 'center',
      alignItems: 'center'
    }
  : {
      positionType: 'absolute',
      width: '30%',
      height: '8%',
      position: { left: '54%', top: '45.25%' },
      justifyContent: 'center',
      alignItems: 'center'
    }

const inventoryOpenGem3Transform: UiTransformProps = mobile
  ? {
      positionType: 'absolute',
      width: '30%',
      height: '8%',
      position: { left: '18%', top: '81%' },
      justifyContent: 'center',
      alignItems: 'center'
    }
  : {
      positionType: 'absolute',
      width: '30%',
      height: '8%',
      position: { left: '18%', top: '81.75%' },
      justifyContent: 'center',
      alignItems: 'center'
    }

const inventoryOpenGem4Transform: UiTransformProps = mobile
  ? {
      positionType: 'absolute',
      width: '30%',
      height: '8%',
      position: { left: '54%', top: '81%' },
      justifyContent: 'center',
      alignItems: 'center'
    }
  : {
      positionType: 'absolute',
      width: '30%',
      height: '8%',
      position: { left: '54%', top: '81.75%' },
      justifyContent: 'center',
      alignItems: 'center'
    }





const questionOpenTransform: UiTransformProps = mobile
  ? {
      display: visibleQuest ? 'flex':'none',
      positionType: 'absolute'  ,
      width: '25%',
      height: '600%',
      position: { top: '200%', right: '9%' } ,
      flexDirection:'row',
      flexWrap:'wrap',
      alignSelf:'center'
    }
  : {
      display: visibleQuest ? 'flex':'none',
      positionType: 'absolute'  ,
      width: '25%',
      height: '600%',
      position: { top: '115%', right: '6%' } ,
      flexDirection:'row',
      flexWrap:'wrap',
      alignSelf:'center'
    }    
 
// Damage indicator: four translucent red bars hugging the screen edge, faded in
// and back out over a second whenever the player loses health (see
// damageIndicator.ts). The alpha is recomputed every frame, so the fade animates
// without a system.
const damageAlpha = getDamageFlashAlpha()

return (
  <UiEntity
    uiTransform={{
      width: '100%',
      height: '8%',
      alignSelf: 'flex-start',
      justifyContent: 'flex-end',
      alignContent: 'flex-end',
    }}
  >

    <UiEntity // DAMAGE INDICATOR START //////////////////////////////////////////////
      // Rendered first so every other HUD element draws on top of it and stays
      // clickable — an overlay placed last would sit over the side buttons.
      uiTransform={{
        display: damageAlpha > 0 ? 'flex' : 'none',
        positionType: 'absolute',
        width: '100%',
        // The root strip is 8% of the screen, so 1250% of it spans the full height.
        height: '1250%',
        position: { top: '0%', left: '0%' }
      }}
    >
      {damageBorderEdge('top', damageAlpha)}
      {damageBorderEdge('bottom', damageAlpha)}
    </UiEntity>

    <UiEntity // INVENTORY UI START ////////////////////////////////////////////////////
        uiTransform={inventoryOpenTransform}
    >
      <UiEntity //parent / modal decoration
          uiTransform={{
            width: '100%',
            height: '100%',
            display: 'flex',
            //position: { left: '50%' } ,
            flexDirection:'column',
            //flexWrap:'wrap',
            //alignSelf:'center'
          }}
          uiBackground={{texture: {src: "images/sideb-backgroundMetal.png"}, textureMode: 'stretch' }}
      >
        {/* Collected resource counts, placed inside the box under each gem:
            gem1/gem2 boxes on the first row, gem3/gem4 boxes on the second. */}
        <UiEntity
          uiTransform={inventoryOpenGem1Transform}
          uiText={{ value: `${resourceCounts.gem1}`, color: Color4.White(), fontSize: 24, textAlign: 'middle-center' }}
        />
        <UiEntity
          uiTransform={inventoryOpenGem2Transform}

          uiText={{ value: `${resourceCounts.gem2}`, color: Color4.White(), fontSize: 24, textAlign: 'middle-center' }}
        />
        <UiEntity
          uiTransform={inventoryOpenGem3Transform}

          uiText={{ value: `${resourceCounts.gem3}`, color: Color4.White(), fontSize: 24, textAlign: 'middle-center' }}
        />
        <UiEntity
          uiTransform={inventoryOpenGem4Transform}

          uiText={{ value: `${resourceCounts.gem4}`, color: Color4.White(), fontSize: 24, textAlign: 'middle-center' }}
        />
      </UiEntity>
    </UiEntity>

    <UiEntity // QUESTS UI START ////////////////////////////////////////////////////
      uiTransform={questionOpenTransform}
    >
      <UiEntity //parent / modal decoration
          uiTransform={{
            width: '100%',
            height: '100%',
            display: 'flex',
            //position: { left: '50%' } ,
            flexDirection:'column',
            //flexWrap:'wrap',
            //alignSelf:'center'
          }}
          uiBackground={{texture: {src: "images/sideb-questbg.png"}, textureMode: 'stretch' }}
      >
        <UiEntity //start table
            uiTransform={{
              width: 400,
              height: '90%',
              display: 'flex',
              position: { top: 75, left: 45 } ,
              flexDirection:'column',
              flexWrap:'wrap'
            }}
        >
        </UiEntity>
        <UiEntity //start table
          uiTransform={{
            width: '100%',
            height: '50px',
            display: 'flex',
            flexDirection:'row',
            flexWrap:'wrap',
            alignSelf:'center',
            justifyContent:'center',
            padding: { bottom:'30px' },
          }}
        >
        </UiEntity>
      </UiEntity>
    </UiEntity>

{/*
    <UiEntity // QUEST BUTTON START ////////////////////////////////////////////////////
        uiTransform={questionTransform}
    >
      <UiEntity //parent / modal decoration
          uiTransform={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection:'column',
          }}
          uiBackground={{texture: {src: "images/sideb-quests.png"}, textureMode: 'stretch' }}
          onMouseDown={() => { 
            console.log("Clicked on sideb-quests") 
            changeSidebarUI(3)
          }}
      >
      </UiEntity>
    </UiEntity>
*/}
    <UiEntity // INVENTORY BUTTON START ////////////////////////////////////////////////////
        uiTransform={inventoryTransform}
    >
      <UiEntity  //parent / modal decoration
        uiTransform={{
        width: '100%',
        height: '100%',
        display: 'flex',
        //position: { left: '50%' } ,
        flexDirection:'column',
        //flexWrap:'wrap',
        //alignSelf:'center'
        }}
        uiBackground={{texture: {src: "images/sideb-bag.png"}, textureMode: 'stretch' }}
        onMouseDown={() => { 
          console.log("Clicked on sideb-bag")
          changeSidebarUI(1)
        }}

      >
      </UiEntity>
    </UiEntity>


    <UiEntity // LOBBY BUTTON START ////////////////////////////////////////////////////
        uiTransform={domeTransform}
    >
      <UiEntity  //parent / modal decoration
        uiTransform={{
        width: '100%',
        height: '100%',
        display: 'flex',
        //position: { left: '50%' } ,
        flexDirection:'column',
        //flexWrap:'wrap',
        //alignSelf:'center'
        }}
        uiBackground={{texture: {src: "images/sideb-lobby.png"}, textureMode: 'stretch' }}
        onMouseDown={() => {
          console.log("Clicked on sideb-lobby")
          // Leaving to the lobby dismisses the finish screen, so its Next Level
          // button can't later build map assets on top of the lobby.
          runFinishedText = null
          requestExperience("lobby")
        }}

      >
      </UiEntity>
    </UiEntity>

    <UiEntity // PARKOUR BUTTON START ////////////////////////////////////////////////////
        uiTransform={parkourTransform}
    >
      <UiEntity  //parent / modal decoration
        uiTransform={{
        width: '100%',
        height: '100%',
        display: 'flex',
        //position: { left: '50%' } ,
        flexDirection:'column',
        //flexWrap:'wrap',
        //alignSelf:'center'
        }}
        uiBackground={{texture: {src: "images/sideb-parkour.png"}, textureMode: 'stretch' }}
        onMouseDown={() => {
          console.log("Clicked on sideb-parkour")
          // Open the level selector (closes the other sidebar panels).
          changeSidebarUI(2)
        }}

      >
      </UiEntity>
    </UiEntity>

    <UiEntity // PARKOUR LEVEL SELECTOR START //////////////////////////////////////////////
      uiTransform={levelSelectOpenTransform}
    >
      <UiEntity //parent / modal decoration
        uiTransform={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
        uiBackground={{texture: {src: "images/sideb-levelselect.png"}, textureMode: 'stretch' }}
      >
        {Array.from({ length: LEVEL_SLOTS }).map((_, i) => {
          const mapNumber = i + 1
          // Slots beyond the built maps are placeholders; real maps must also be
          // unlocked to be selectable.
          const enabled = i < maps.length && getUnlockedMaps()[i]
          const col = i % 2 // 0 = left, 1 = right
          const row = Math.floor(i / 2) // 0..4
          return (
            <UiEntity
              key={`level-select-${i}`}
              uiTransform={{
                // Two buttons per row (1 2 / 3 4 / ...), positioned absolutely so
                // each gets its own clickable area.
                positionType: 'absolute',
                width: '25%',
                height: '10%',
                position: { left: col === 0 ? '17%' : '58%', top: `${18 + row * 16}%` },
                justifyContent: 'center',
                alignItems: 'center'
              }}
              // Tiered button image per map; dimmed when not selectable.
              uiBackground={{
                texture: { src: levelButtonImage(mapNumber) },
                textureMode: 'stretch',
                color: enabled ? Color4.White() : Color4.create(0.4, 0.4, 0.4, 1)
              }}
              uiText={{
                value: `${mapNumber}`,
                color: enabled ? Color4.White() : Color4.create(0.6, 0.6, 0.6, 1),
                fontSize: 24,
                textAlign: 'middle-center'
              }}
              onMouseDown={() => {
                if (!enabled) {
                  console.log('Map', mapNumber, 'is locked or unavailable')
                  return
                }
                console.log('Selected map', mapNumber)
                // Dismiss any lingering finish screen / Next Level button so it
                // can't advance past the selected map into a locked one.
                runFinishedText = null
                setCurrentLevel(i)
                visibleLevelSelect = false
                if (getCurrentExperience() === 'runner') {
                  // Already in the runner: requestExperience('runner') would no-op
                  // (same experience), so rebuild the area for the chosen map directly.
                  createGameArea()
                  sendResetHealth()
                } else {
                  requestExperience('runner')
                }
              }}
            />
          )
        })}
      </UiEntity>
    </UiEntity>

    <UiEntity //RUNNER HEALTH UI START ////////////////////////////////////////////////////
      uiTransform={{
        display: inRunner ? 'flex': 'none',
        positionType: 'absolute',
        // Slightly larger on mobile (kept horizontally centred: right = (100 - width) / 2).
        width: mobile ? '20%' : '17%',
        height: mobile ? '125%' : '100%',
        // Mobile: health sits at the top of the screen (gem row right below it);
        // desktop keeps it at the bottom. Percentages are of the 8%-high root strip.
        position: mobile ? { top: '20%', right: '41%' } : { top: '1150%', right: '42%' },
        flexDirection:'row',
        flexWrap:'wrap',
        alignSelf:'center',
        justifyContent: 'flex-end',
      }}
    >
      <UiEntity
        uiTransform={{
            width: '84%', //HEALTH and ENERGY max width
            height: '100%',
            justifyContent: 'center',
            //flexWrap: 'wrap'
            flexDirection: 'column',
            //alignItems: 'flex-start',
            alignSelf: 'center',
            margin: { right:'5px' },
          }}
        >
          <UiEntity
            uiTransform={{
              width: `${healthPercentage}%`,
              height: mobile ? '50%' : '43%',
              margin: { top:'0px' },
              //alignSelf: 'center',
              //flexWrap: 'wrap'
              //flexDirection: 'column'
            }}
            uiBackground={{
              textureMode: 'stretch',
              texture: {
                src: 'images/health.png'
              },
            }}
          />

          <UiEntity //Health value text. Its own entity declared AFTER the fill:
            // uiText on the parent renders under child backgrounds on the mobile
            // explorer (desktop draws it above), but sibling order wins on both.
            uiTransform={{
              positionType: 'absolute',
              width: '100%',
              height: '100%',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            uiText={{
              value: `${healthPercentage/10}`+'/10',
              color: Color4.White(),
              fontSize: 18
            }}
          />

        </UiEntity>

        <UiEntity //Decorative frame, drawn on top of the health fill so the fill appears inside it
          uiTransform={{
            positionType: 'absolute',
            width: '100%',
            height: '100%',
          }}
          uiBackground={{textureMode: 'stretch', texture: {src: 'images/healthbg.png'},}}
        />
    </UiEntity>

    <UiEntity //GEM COLLECTING UI ////////////////////////////////////////////////////
      uiTransform={{
        display: inRunner ? 'flex': 'none',
        positionType: 'absolute',
        /*
        width: '17%',
        height: '100%',
        position: { top: '20%', right: '42%' }
*/

        // Full-width row centered horizontally so the gem counters + timer stay
        // centered and keep their fixed size regardless of how many gem types
        // the current map has.
        
        // Percentage-based like the rest of the HUD, so the row scales with the
        // screen (the old fixed 50px height/80px boxes didn't). Height is % of
        // the 8%-high root strip; slightly larger on mobile.
        width: '100%',
        height: mobile ? '75%' : '60%',
        // Mobile: tight under the health bar (which occupies the strip at
        // top 20%-140%); desktop keeps the row near the top of the screen.
        position: mobile ? { top: '125%' } : { top: '20%' },
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'


      }}
    >
      {getMapGemTotals().map(([gem, total]) => (
        <UiEntity
          key={gem}
          uiTransform={{
            width: mobile ? '6%' : '4.5%',
            height: '100%',
            margin: { right: '0.3%' }
          }}
          uiBackground={{texture: {src: gemBackgrounds[gem]}, textureMode: 'stretch' }}
          uiText={{
            value: getGemCountByType(gem).toString() + '/' + total.toString(),
            color: Color4.White(),
            fontSize: 16
          }}
        />
      ))}
      <UiEntity
        uiTransform={{
          width: mobile ? '6%' : '4.5%',
          height: '100%',
        }}
        uiBackground={{texture: {src: gemBackgrounds[1]}, textureMode: 'stretch' }}
        uiText={{ value: getFormattedElapsedTime(), color: Color4.White(), fontSize: 16 }}
      >
      </UiEntity>
    </UiEntity>



  </UiEntity>
  )
}






// Local state for the "Choose Experience" panel visibility. React-ECS
// re-renders every frame, so a simple module-level boolean is enough —
// no hooks required.
let experiencePanelOpen = false

function requestExperience(kind: ExperienceKind): void {
  console.log(
    `[ExperienceUI] option clicked — kind=${kind} current=${getCurrentExperience()} switching=${isSwitching()}`,
  )
  if (isSwitching()) {
    console.log('[ExperienceUI] ignored — switch already in progress')
    return
  }
  if (getCurrentExperience() === kind) {
    console.log('[ExperienceUI] ignored — already in that experience')
    return
  }
  experiencePanelOpen = false
  switchExperience(kind).catch((err) => {
    console.log('[ExperienceUI] switchExperience failed', kind, err)
  })
}


// ----- Top-level UI component ---------------------------------------

/////// ----- RUNNER UI --------------------------------------

/**
 * Background image shown behind each gem's collected count, one per gem type.
 */
// Each gem's count background is keyed off its numeric value ('1'-'4'), so
// gemN always uses gemcountN.png regardless of which colour name is bound to it.
const gemBackgrounds: Record<Gem, string> = (Object.values(Gem) as Gem[]).reduce(
  (acc, gem) => {
    acc[gem] = `images/gemcount${gem}.png`
    return acc
  },
  {} as Record<Gem, string>
)

/**
 * Counts how many of each gem type the current map contains, preserving the order
 * in which the gem types first appear. Only gem types present in the map are
 * included, so the inventory UI shows just the relevant gems for that level.
 */
function getMapGemTotals(): [Gem, number][] {
  const totals = new Map<Gem, number>()
  for (const { gemType } of getCurrentGems()) {
    totals.set(gemType, (totals.get(gemType) ?? 0) + 1)
  }
  // Always order gem1 -> gem4 (the Gem values are the numeric strings '1'-'4'),
  // so the inventory icons stay left-to-right by gem type regardless of which
  // gems were collected first.
  return [...totals].sort(([a], [b]) => Number(a) - Number(b))
}

/**
 * Button used to advance to the next level. Shown under the FINISHED text on the
 * finish screen; dismisses the finish overlay and builds the next level.
 */
function renderNextLevelButton() {
  return (
    <Button
      uiTransform={{
        width: 220,
        height: 64,
        margin: { top: 16 },
      }}
      uiBackground={{ texture: { src: 'images/button1.png' }, textureMode: 'stretch' }}
      value={'Next level'}
      fontSize={18}
      onMouseDown={() => {
        // Always dismiss the finish screen.
        runFinishedText = null
        // Guard: never build a map outside the runner (e.g. a stale click that
        // lands while switching to the lobby would overlay map assets on it).
        if (getCurrentExperience() !== 'runner') {
          console.log('[NextLevel] not in runner — ignoring')
          return
        }
        // Only advance if the next map exists and the player has unlocked it.
        const nextLevel = getCurrentLevel() + 1
        if (nextLevel < maps.length && getUnlockedMaps()[nextLevel]) {
          setCurrentLevel(nextLevel)
          createGameArea()
          sendResetHealth()
        } else {
          console.log('[NextLevel] next map locked or none — not advancing')
        }
      }}
    />
  )
}



/////// ----- RUNNER UI END --------------------------------------

/**
 * HUD that displays the player's position in two coordinate spaces:
 *
 * - World: the raw scene-space position reported by the engine (0..96 in this scene).
 * - Map: the same point in the coordinate base the map files (map1/2/3.ts) use to
 *   place entities. Every map entity is parented to the game area, an identity child
 *   of the scene root, so map coordinate = world position − root position. The maps
 *   look like they use different bases only because each map model is centered
 *   differently; the placement math is the same for all of them. Stand where you want
 *   an obstacle and read the Map line to get the `position` to paste into the map file.
 *
 * React-ECS re-renders every frame, so reading the live Transforms here keeps the
 * values updated as the player moves.
 */
function renderPlayerPosition() {
  const pos = Transform.getOrNull(engine.PlayerEntity)?.position
  const rootPos = Transform.getOrNull(getRootEntity())?.position

  const worldText = pos
    ? `World   X ${pos.x.toFixed(1)}   Y ${pos.y.toFixed(1)}   Z ${pos.z.toFixed(1)}`
    : 'World   X --   Y --   Z --'

  const mapText =
    pos && rootPos
      ? `Map     X ${(pos.x - rootPos.x).toFixed(1)}   Y ${(pos.y - rootPos.y).toFixed(1)}   Z ${(pos.z - rootPos.z).toFixed(1)}`
      : 'Map     X --   Y --   Z --'

  return (
    <UiEntity
      key="player-position-hud"
      uiTransform={{
        positionType: 'absolute',
        position: { top: '10%', left: '1%' },
        flexDirection: 'column',
      }}
    >
      <UiEntity
        uiTransform={{ width: 260, height: 32, justifyContent: 'center', alignItems: 'center' }}
        uiBackground={{ color: { r: 0, g: 0, b: 0, a: 0.6 } }}
        uiText={{ value: worldText, color: Color4.White(), fontSize: 14, textAlign: 'middle-center' }}
      />
      <UiEntity
        uiTransform={{ width: 260, height: 32, justifyContent: 'center', alignItems: 'center', margin: { top: 2 } }}
        uiBackground={{ color: { r: 0, g: 0, b: 0, a: 0.6 } }}
        uiText={{ value: mapText, color: { r: 0.55, g: 0.9, b: 1, a: 1 }, fontSize: 14, textAlign: 'middle-center' }}
      />
    </UiEntity>
  )
}

/**
 * Persistent finish screen text ("FINISHED\n<time>"), set when the server confirms
 * a completed run. While set, the center overlay shows it with the Next Level
 * button underneath. Cleared when the player advances to the next level.
 */
let runFinishedText: string | null = null

/** Shows the finish screen (FINISHED + exact time) with a Next Level button. */
export function showRunFinished(text: string): void {
  runFinishedText = text
}

/**
 * Center overlay. While a run is finished it shows the persistent FINISHED screen
 * (big text + Next Level button); otherwise it shows the transient message from
 * getCenterMessage() (e.g. "Watch your step!"), which hides after its 3s.
 */
function renderCenterMessage() {
  // The FINISHED screen (and its Next Level button) only exists inside the
  // runner: anywhere else — e.g. after switching to the lobby — it must not
  // render, or Next Level could build map assets over the current experience.
  if (runFinishedText !== null && getCurrentExperience() === 'runner') {
    return (
      <UiEntity
        key="center-message"
        uiTransform={{
          positionType: 'absolute',
          width: '100%',
          height: '100%',
          position: { top: 0, left: 0 },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <UiEntity
          uiTransform={{ width: '100%', height: 140, justifyContent: 'center', alignItems: 'center' }}
          uiText={{ value: runFinishedText, color: Color4.White(), fontSize: 60, textAlign: 'middle-center' }}
        />
        {renderNextLevelButton()}
      </UiEntity>
    )
  }

  const { text, visible } = getCenterMessage()
  return (
    <UiEntity
      key="center-message"
      uiTransform={{
        display: visible ? 'flex' : 'none',
        positionType: 'absolute',
        width: '100%',
        height: '100%',
        position: { top: 0, left: 0 },
        justifyContent: 'center',
        alignItems: 'center'
      }}
      uiText={{ value: text, color: Color4.White(), fontSize: 60, textAlign: 'middle-center' }}
    />
  )
}

/**
 * Safe-area test switch: when true, tints the device-safe inset region 50% black
 * (the docs example) so you can see exactly where the notch / status bar / home
 * indicator margins are on a phone. On desktop the insets are zero, so the tint
 * covers the whole screen there. Set false once verified.
 */
const SHOW_INSET_DEBUG = true

/**
 * The whole HUD is wrapped in ScreenInsetArea, which constrains children to the
 * area inside the renderer-reported device safe margins (notch, status bar, home
 * indicator, rounded corners). The absolute 100%x100% roots inside now measure
 * against the safe area instead of the full canvas, so on mobile every UI element
 * shifts clear of the hardware cutouts; on desktop insets are zero and nothing
 * changes.
 *
 * NOTE: in the local preview, the scene-analytics modal overlays part of the
 * canvas and eats clicks over the sidebar buttons — that's a preview-only
 * artifact; on a deployed scene everything stays clickable.
 */
const uiComponent = () => (
  <ScreenInsetArea>
    <UiEntity
      key="inset-debug"
      uiTransform={{
        display: SHOW_INSET_DEBUG ? 'flex' : 'none',
        positionType: 'absolute',
        width: '100%',
        height: '100%',
        position: { top: 0, left: 0 }
      }}
     // uiBackground={{ color: Color4.create(0, 0, 0, 0.5) }}
    />
    {mainUIComponent()}
    {renderCenterMessage()}
  </ScreenInsetArea>
)


export function setupUi(): void {
  ReactEcsRenderer.setUiRenderer(uiComponent)
}

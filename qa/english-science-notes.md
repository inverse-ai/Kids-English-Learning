# English for Science implementation and verification

Ten complete lessons are added to the existing Little English homepage and navigation, using the existing app shell, Sonia English playback, real MP3 word-boundary timestamps, optional written Bangla hints, active child profile, local storage, parent report and due-review system. No backend or separate app is introduced.

| Lesson | Words introduced | Visual activity |
| --- | --- | --- |
| Plants Need Sunlight | plant, sunlight, cover, pale | Compare two grass patches with the same care; lift an opaque cover after several simulated days. Covered grass becomes pale and weak, not instantly dead. |
| Where Does Rain Come From? | river, warm, water vapour, cool, cloud, rain | Rain fills the river; sunlight warms it; arrows represent invisible gas; cooling forms tiny cloud droplets; rain falls. Each change has its own screen. |
| Our Body Helpers | brain, heart, lungs, stomach | Select an organ in a friendly body model; the selected organ pulses, the sentence changes, then movement stops. |
| Our Five Senses | see, hear, smell, taste, touch | See a butterfly, hear a bell, smell a flower, taste an apple and feel a soft toy. |
| Animal Homes | nest, pond, farm, forest | Match animals to the places shown in the lesson. These examples are not exclusive habitat rules. |
| Day and Night | Earth, turn, day, night | Turn the marked place on Earth between the lit and dark halves. The Sun stays in the same direction. |
| Float or Sink? | float, sink, wooden block, steel key | Place an ordinary dry wooden block, solid steel key or sealed hollow plastic ball in water; observe the surface or bottom position. |
| Push and Pull | push, pull, toy, wagon | Move a toy away from the child or pull the wagon toward the child; the rope follows the wagon. |
| A Magnet Can Pull | magnet, metal, steel, aluminium | Test a plain carbon-steel clip, wood and aluminium foil. Only this steel clip visibly moves toward the ordinary magnet. |
| A Switch Turns the Light On | switch, lamp, on, off | Operate a pretend on-screen switch; the lamp's glow and sentence change. No wiring instructions. |

Each lesson introduces one word at a time, then presents sentences and scenes, one or two picture questions, a recap and one practice star. Audio is optional. Questions have unique supported answers. Wrong answers show the correct picture/answer and a specific spoken clue; two misses offer an easier two-choice retry and spoken demonstration. Success remains visible until Next. Stars record practice, not independent mastery.

## Science content checks

These primary sources informed the accuracy review:

- Plants become pale and weak without suitable light: [University of Maine Extension](https://extension.umaine.edu/publications/5059e/) and [University of Florida IFAS: etiolation](https://propg.ifas.ufl.edu/02-environment/01-light/01-light-etiolation.html).
- Evaporation and cloud droplets are separate steps: [NASA water cycle](https://science.nasa.gov/kids/earth/what-is-the-water-cycle/) and [NASA cloud formation](https://science.nasa.gov/kids/earth/how-do-clouds-form/).
- Earth rotation causes day and night: [NASA StarChild](https://starchild.gsfc.nasa.gov/docs/StarChild/questions/question31.html).
- Ordinary magnetic attraction differs between materials: [Exploratorium magnetic tightrope](https://annex.exploratorium.edu/xref/exhibits/magnetic_tightrope.html) and [Exploratorium magnetic responses](https://annex.exploratorium.edu/wsw/progress_snacks/diamagnetism_www/).
- Body descriptions: [NHLBI: lungs and the heart](https://www.nhlbi.nih.gov/health/lungs/breathing-benefits) and [NHLBI: breathing control](https://www.nhlbi.nih.gov/health/lungs/body-controls-breathing).

The models explicitly acknowledge their limits: invisible vapour is represented by arrows; anatomy is approximate; Earth sizes/distances are not to scale; float/sink results belong to the particular objects; not every steel or metal is attracted. Parent explanations appear in a collapsible area.

## Progress and preservation

Science uses stable lesson/question IDs and an optional `learning.science` field. Older profile exports stay compatible without a Science field. The active profile stores lesson step, introduced vocabulary, experiment selections and tried options, completed steps, answer choices, first-attempt success, misses and assisted attempts. Home stops playback and retains the exact place; Continue resumes it without narration autoplay. Additive restore keeps whole existing activity records when an imported file conflicts.

Missed questions use the existing profile-specific 1-day review. Successful unassisted recall extends to 3 and 7 days, then existing later intervals; assisted answers return in 1 day. Parent reports show science lessons and missed questions alongside existing reading practice. Progress remains browser-local; exported files are needed for backups.

## Automated and visual verification

- `npm run check`: all shipped JavaScript modules parse; this static project has no separate build step.
- `node qa/english-science.mjs`: all 10 complete lessons on 390px touch-capable Edge and 1366px mouse Edge; all 18 questions tested with incorrect and correct choices; 32 experiment-option runs; 120 screen/layout cases at 320, 360, 390, 430, 768 and 1366px with normal and doubled text. No horizontal page overflow or clipped controls; tested child controls are at least 56×56px; normal phone text is at least 16px.
- Finite animation and replay checks cover the lifted bowl, Earth rotation, sinking object, push, pull and magnetic attraction. The lamp toggles visually. Reduced motion renders the final scene without animation.
- 189 Science audio specifications map to decodable clips with audible sample energy and real word timestamps. Actual browser playback at normal and slower speed verifies moving word highlighting, frozen highlights on Pause, Resume, Replay, cancellation on navigation and no overlapping audio. Existing audio mappings remain intact.
- Keyboard Enter/Space, native focus behavior, labelled scenes, per-profile history, validated export/restore, saved experiments, Home/Continue, parent reports and picture-based due review are checked.
- Existing Math, usability, profile/report/review, Listen & Move, homepage, audio-catalog and PWA suites are regression checks. Their JSON reports contain the results. PWA verifies the new Science scenes and unfinished experiment resume offline.
- Scene gallery and 390px/1366px screenshots were visually inspected for concept accuracy, placement and readability.

## Remaining verification limits

The agent could decode and exercise playback but could not perform a human listening assessment of English pronunciation, clarity, teaching tone or naturalness. A parent should listen to the Science words, sentences, hints, praise and demonstrations at both speeds. Existing English/Bangla clips are kept; no replacement or new Bangla Science recording is claimed. Bangla help in Science is written.

Touch checks use browser emulation rather than physical Android/iPhone/iPad devices. PWA installability, offline operation and updates are browser-tested; a physical Home Screen installation still needs device testing.

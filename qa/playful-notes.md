# Playful learning update

The existing app, six-section registry, lessons, narration assets and browser-local profiles are retained. New guided practice is stored separately under `learning.playful`; old completion is never transferred to a new game. Original reading and writing remain accessible through **Read without games**, and existing Continue routes retain their positions.

## Complete activity paths

| Section | Coverage | Child actions |
| --- | --- | --- |
| Letters | All 26 letters | Find, hear name/sound separately, draw or tap matching pairs, sound-picture choices, guided big/little tracing, rearranged recognition challenge |
| Words | 48 existing picture words | Hear sounds, finger blending or taps, drag/tap sound tiles, reveal the picture, change an initial sound, picture-word challenge |
| Stories | All 47 existing stories, including the 23 values stories | Optional vocabulary, unscored prediction, exact sentence reading, relevant placement actions, comprehension, picture order, uninterrupted paragraph rereading |
| Listen & Move | Existing 10 lessons and final two-step review | Preserved dragging, tap placements and accessible route selections; position highlight and per-position review records added |
| English for Math | All 12 existing lessons | Count, join groups, fly a bird away, equal sharing with movable pieces, group apples, match shapes, align ribbons, pour water, collect fruit, set a clock, arrange chart stickers; different-example final challenges |
| English for Science | All 10 existing lessons | Several-day plant comparison, staged water cycle and ordering, organ exploration/job matching, senses, habitats, Earth rotation, predict/test/sort float and magnet results, push/pull, pretend lamp switch |

The orange cat guides practice. Explicit completion grows a flower in a collapsible learning garden; existing completed movement lessons also appear there. Flowers record practice, including help, rather than independent mastery.

## Learning support and progress

Wrong answers reveal a useful answer or hint, allow retries and offer a demonstration. Help is recorded. Predictions are not scored. Science sorting records assistance for the particular object, rather than falsely marking every object as helped.

Existing per-profile history, parent reports, review scheduling, fluency rounds and versioned export/restore are reused. Missed/helped recall returns after one day; remembered review progresses through three and seven days, then longer intervals. New science concepts and movement positions have stable review IDs. No accounts or backend were added. Parents must keep an exported file to restore progress after clearing browser data.

## Verification

- `npm run check`: JavaScript syntax checks; this static project has no separate bundler build.
- `qa/playful.mjs`: all 143 guided paths completed; 2,056 layout checks.
- `qa/playful-controls.mjs`: 22 real pointer/touch checks covering matching, blending, tile building, sharing, alignment, story placement, feedback and resume.
- `qa/playful-integration.mjs`: section entry points, original saved reading position, 16 demonstrations, touch sorting, keyboard pairs, enlarged text and normal/reduced motion.
- Existing Math, Science, profile/practice, Listen & Move and PWA checks retained and run. The old reading modes are tested via their new **Read without games** entry.
- Phone widths 320, 360, 390 and 430 CSS pixels, tablet 768 and desktop 1366; no horizontal page overflow found in the tested pages. HTML child controls meet 56px minimums, phone text is at least 16px, and small diagram objects have large button alternatives.
- New audio content decodes and has a non-silent signal. Actual normal/slower playback, timestamp-driven highlighting, Pause/Resume, Replay, stopping on Home and non-overlap tested. Existing English, Bangla and Arabic mappings preserved. The refuge paragraph plays its full English story with the Arabic phrase supplied by its separate existing recording, never by English transliteration speech.

## Limits

No human listening assessment of English/Bangla/Arabic pronunciation, warmth or clarity was performed. A parent or qualified speaker still needs to listen. Existing Arabic audio uses whole-phrase highlighting when word timings are unavailable. New Math/Science Bangla help remains written; no new Bangla recordings are claimed. Touch was tested with trusted browser touch events, not physical Android/iOS devices. Physical Home Screen installation remains unverified. Tracing feedback records practice, not handwriting assessment. No session-duration or independent-reading mastery claim is made.

# Game Assets

This directory contains the visual assets for the Spell Casting Game.

## Directory Structure

- `/disciplines/` - Contains visual cues for each spell discipline (Fire, Water, Air, etc.)
- `/demonstrations/` - Contains videos demonstrating spell cast gestures for the tutorial
- `/effects/` - Contains animations for spell effects (casting and impact)

## Asset Naming Convention

- Discipline cues: `[discipline_name].gif` (e.g., `fire.gif`, `water.gif`)
- Demonstration videos: `[discipline_name]_[spell_name].mp4` (e.g., `fire_fireball.mp4`)
- Spell effects:
  - Casting: `[spell_id]_casting.gif` (e.g., `fireball_casting.gif`)
  - Impact: `[spell_id]_impact.gif` (e.g., `fireball_impact.gif`)
  - Status: `[effect_type]_effect.gif` (e.g., `blind_effect.gif`)

## Asset Placeholder

The game currently uses placeholder references to these assets. You should replace them with actual assets before running the application in production.

### Creating Placeholder Assets

For development purposes, you can create simple placeholder GIFs and videos:

1. For GIFs: Use online GIF creation tools to create simple animations
2. For demonstration videos: Record simple hand gesture demonstrations
3. Place the files in their respective directories following the naming convention

### Resources for Creating Assets

- [GIPHY](https://giphy.com/create/gifmaker) - For creating simple GIFs
- [OBS Studio](https://obsproject.com/) - For recording demonstration videos
- [ezgif](https://ezgif.com/maker) - Online tool for creating and editing GIFs 
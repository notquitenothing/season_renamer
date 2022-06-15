# Season Renamer
Node app for converting an almost organized folder of media into Jellyfin parsable filenames.

## Usage
Target path must contain episodes already organized into folders like "Season 01" and "Specials".
App only renames episodes to standard "SxxxEyyy" convention, based on whether an episode number is already present or otherwise alphanumeric order.

Run by using command `node main.js "{folder-path}"`

Examples: 
```
node main.js "~\Videos\Favorite Show"
node main.js "D:\video\worst_show"
```

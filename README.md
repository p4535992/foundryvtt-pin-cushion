# Pin Cushion

![create-pin](https://github.com/death-save/media/blob/master/pin-cushion/create_pin.png)
![note-config](https://github.com/death-save/media/blob/master/pin-cushion/note-config.png)
![journal-preview](https://github.com/death-save/media/blob/master/pin-cushion/journal-preview.png)

## Features

- Changes the dropdown of map pin icons into a filepicker so users can select any icons they like
- Adds the ability to double-click the canvas while on the Notes Layer and create a map pin (and corresponding Journal Entry)
- Adds a preview of the associated Journal Entry when you hover over a map pin
- Removes the background box from map notes

![img](./img/backgroundless-pins-preview.gif)

- Add the possibility to add a thubnail preview of the journal

![img](./img/journal-thumbnail.png)

- Add an option to have a 'revealed' state on scene Notes.

When enabled, then the 'revealed' state will be used to determine if the Note is visible to players.
(The default Foundry VTT behaviour is for Notes to be visible to players only if the linked document is accessible by the player.)

- Add an option to set the tint colour of the Note icon to indicate if the linked document is reachable or not (if the Note has no linked document, then it will always be displayed in the "unreachable" tint).

## Installation

It's always easiest to install modules from the in game add-on browser.

To install this module manually:
1.  Inside the Foundry "Configuration and Setup" screen, click "Add-on Modules"
2.  Click "Install Module"
3.  In the "Manifest URL" field, paste the following url:
`https://raw.githubusercontent.com/death-save/pin-cushion/master/module.json`
1.  Click 'Install' and wait for installation to complete
2.  Don't forget to enable the module in game using the "Manage Module" button

## Installation (developement branch)

It's always easiest to install modules from the in game add-on browser.

To install this module manually:
1.  Inside the Foundry "Configuration and Setup" screen, click "Add-on Modules"
2.  Click "Install Module"
3.  In the "Manifest URL" field, paste the following url:
`https://raw.githubusercontent.com/p4535992/pin-cushion/master/module-dev.json`
1.  Click 'Install' and wait for installation to complete
2.  Don't forget to enable the module in game using the "Manage Module" button

### libWrapper

This module uses the [libWrapper](https://github.com/ruipin/fvtt-lib-wrapper) library for wrapping core methods. It is a hard dependency and it is recommended for the best experience and compatibility with other modules.

# Build

## Install all packages

```bash
npm install
```
## npm build scripts

### build

will build the code and copy all necessary assets into the dist folder and make a symlink to install the result into your foundry data; create a
`foundryconfig.json` file with your Foundry Data path.

```json
{
  "dataPath": "~/.local/share/FoundryVTT/"
}
```

`build` will build and set up a symlink between `dist` and your `dataPath`.

```bash
npm run-script build
```

### NOTE:

You don't need to build the `foundryconfig.json` file you can just copy the content of the `dist` folder on the module folder under `modules` of Foundry

### build:watch

`build:watch` will build and watch for changes, rebuilding automatically.

```bash
npm run-script build:watch
```

### clean

`clean` will remove all contents in the dist folder (but keeps the link from build:install).

```bash
npm run-script clean
```
### lint and lintfix

`lint` launch the eslint process based on the configuration [here](./.eslintrc)

```bash
npm run-script lint
```

`lintfix` launch the eslint process with the fix argument

```bash
npm run-script lintfix
```

### prettier-format

`prettier-format` launch the prettier plugin based on the configuration [here](./.prettierrc)

```bash
npm run-script prettier-format
```

### package

`package` generates a zip file containing the contents of the dist folder generated previously with the `build` command. Useful for those who want to manually load the module or want to create their own release

```bash
npm run-script package
```

## [Changelog](./changelog.md)

## Issues

Any issues, bugs, or feature requests are always welcome to be reported directly to the [Issue Tracker](https://github.com/death-save/vtt-pin-cushion/issues ), or using the [Bug Reporter Module](https://foundryvtt.com/packages/bug-reporter/).

## License

- [FVTT-Backgroundless-Pins](https://github.com/schultzcole/FVTT-Backgroundless-Pins) ([GPLv3 License](https://github.com/schultzcole/FVTT-Backgroundless-Pins/blob/master/LICENSE))
- [foundryvtt-journal-thumbnail](https://github.com/J-Guenther/foundryvtt-journal-thumbnail) ([MIT](https://github.com/J-Guenther/foundryvtt-journal-thumbnail/blob/main/LICENSE))
- [Point of Interest Teleporter](https://github.com/zeel01/poi-teleport) ([MIT](https://github.com/zeel01/poi-teleport/blob/master/LICENSE))
- [vtt-gmtext-in-notes](https://github.com/farling42/fvtt-gmtext-in-notes) ([MIT](https://github.com/farling42/fvtt-gmtext-in-notes/blob/master/LICENSE))
- [fvtt-revealed-notes-manager](https://github.com/farling42/fvtt-revealed-notes-manager) ([MIT](https://github.com/farling42/fvtt-gmtext-in-notes/blob/master/LICENSE))

This package is under an [GPLv3 License](LICENSE) and the [Foundry Virtual Tabletop Limited License Agreement for module development](https://foundryvtt.com/article/license/).

## Acknowledgements

- Thank you to [schultzcole](https://github.com/schultzcole) for the module [FVTT-Backgroundless-Pins](https://github.com/schultzcole/FVTT-Backgroundless-Pins) inspiration
- Thank you to [J-Guenther](https://github.com/J-Guenther) for the module [foundryvtt-journal-thumbnail](https://github.com/J-Guenther/foundryvtt-journal-thumbnail) inspiration
- Thank you to [zeel](https://github.com/zeel01) for the module [Point of Interest Teleporter](https://github.com/zeel01/poi-teleport)
- Thank you to [farling42](https://github.com/farling42) and the module [vtt-gmtext-in-notes](https://github.com/farling42/fvtt-gmtext-in-notes)
- Thank you to [farling42](https://github.com/farling42) and the module [fvtt-revealed-notes-manager](https://github.com/farling42/fvtt-revealed-notes-manager)

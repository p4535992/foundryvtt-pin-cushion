/* ------------------------------------ */
/* Other Hooks							*/
/* ------------------------------------ */
import API from "./scripts/api.js";
import CONSTANTS from "./scripts/constants.js";
import { stripQueryStringAndHashFromPath, retrieveFirstImageFromJournalId } from "./scripts/lib/lib.js";
import { registerSettings } from "./scripts/settings.js";
import { registerSocket } from "./scripts/socket.js";
import { PinCushionHUD } from "./scripts/apps/PinCushionHUD.js";
import { PinCushion } from "./scripts/apps/PinCushion.js";
import Logger from "./scripts/lib/Logger.js";
// import { ActionConfig } from "/modules/monks-active-tiles/apps/action-config.js";
// import { MonksActiveTiles } from "/modules/monks-active-tiles/monks-active-tiles.js";
// import { PinCushionContainer } from "./scripts/apps/PinCushionContainer.js";
// import { PinCushionHUDV2 } from "./scripts/apps/PinCushionHUDV2.js";
// import { noteControl } from "./scripts/apps/NoteControl.js";

/* -------------------------------------------------------------------------- */
/*                                    Hooks                                   */
/* -------------------------------------------------------------------------- */

/* ------------------------------------ */
/* Initialize module					*/
/* ------------------------------------ */
Hooks.once("init", function () {
    Logger.log(" init " + CONSTANTS.MODULE_ID);
    // TODO TO REMOVE
    globalThis.PinCushion = PinCushion;
    // globalThis.setNoteRevealed = setNoteRevealed; // Seem not necessary
    // globalThis.setNoteGMtext = setNoteGMtext // Seem not necessary
    registerSettings();

    // // href: https://stackoverflow.com/questions/8853396/logical-operator-in-a-handlebars-js-if-conditional/16315366#16315366
    // // e.g. {{#ifCond var1 '==' var2}}
    // Handlebars.registerHelper("ifCond", function (v1, operator, v2, options) {
    // 	switch (operator) {
    // 		case "==": {
    // 			return v1 == v2 ? options.fn(this) : options.inverse(this);
    // 		}
    // 		case "===": {
    // 			return v1 === v2 ? options.fn(this) : options.inverse(this);
    // 		}
    // 		case "!=": {
    // 			return v1 != v2 ? options.fn(this) : options.inverse(this);
    // 		}
    // 		case "!==": {
    // 			return v1 !== v2 ? options.fn(this) : options.inverse(this);
    // 		}
    // 		case "<": {
    // 			return v1 < v2 ? options.fn(this) : options.inverse(this);
    // 		}
    // 		case "<=": {
    // 			return v1 <= v2 ? options.fn(this) : options.inverse(this);
    // 		}
    // 		case ">": {
    // 			return v1 > v2 ? options.fn(this) : options.inverse(this);
    // 		}
    // 		case ">=": {
    // 			return v1 >= v2 ? options.fn(this) : options.inverse(this);
    // 		}
    // 		case "&&": {
    // 			return v1 && v2 ? options.fn(this) : options.inverse(this);
    // 		}
    // 		case "||": {
    // 			return v1 || v2 ? options.fn(this) : options.inverse(this);
    // 		}
    // 		default: {
    // 			return options.inverse(this);
    // 		}
    // 	}
    // });

    Hooks.once("socketlib.ready", registerSocket);

    libWrapper.register(
        CONSTANTS.MODULE_ID,
        "NotesLayer.prototype._onClickLeft2",
        PinCushion._onDoubleClick,
        "OVERRIDE",
    );

    const enablePlayerIconAutoOverride = game.settings.get(CONSTANTS.MODULE_ID, "playerIconAutoOverride");
const isV13 = parseInt(game.version.split('.')[0]) >= 9;

// W v13 metoda prepareData jest na NoteDocument, w v12 na Note
const prepareDataMethod = isV13 ? "NoteDocument.prototype.prepareData" : "Note.prototype.prepareData";

// W v13 metoda getData na NoteConfig może nie istnieć — w takim wypadku pominąć rejestrację
// albo zarejestrować tylko _getSubmitData jeśli jest dostępne
const noteConfigGetDataMethod = isV13 && ("getData" in NoteConfig.prototype) ? "NoteConfig.prototype.getData" : null;
const noteConfigGetSubmitDataMethod = isV13 && ("_getSubmitData" in NoteConfig.prototype) ? "NoteConfig.prototype._getSubmitData" : null;

if (enablePlayerIconAutoOverride) {
    libWrapper.register(
        CONSTANTS.MODULE_ID,
        prepareDataMethod,
        PinCushion._onPrepareNoteData,
        "WRAPPER"
    );
}

if (noteConfigGetDataMethod) {
    libWrapper.register(
        CONSTANTS.MODULE_ID,
        noteConfigGetDataMethod,
        PinCushion._noteConfigGetData
    );
}

if (noteConfigGetSubmitDataMethod) {
    libWrapper.register(
        CONSTANTS.MODULE_ID,
        noteConfigGetSubmitDataMethod,
        PinCushion._noteConfigGetSubmitData
    );
}

});
/* ------------------------------------ */
/* Setup module							*/
/* ------------------------------------ */
Hooks.once("setup", function () {
    game.modules.get(CONSTANTS.MODULE_ID).api = API;

    const forceToShowNotes = game.settings.get(CONSTANTS.MODULE_ID, "forceToShowNotes");
    if (forceToShowNotes) {
        // Automatically flag journal notes to show on the map without having to have your players turn it on themselves.
        game.settings.set("core", "notesDisplayToggle", true);
    }

    const enableAutoScaleNamePlatesNote = game.settings.get(CONSTANTS.MODULE_ID, "enableAutoScaleNamePlatesNote");
    if (enableAutoScaleNamePlatesNote) {
        Hooks.once("canvasReady", () => {
            Hooks.on("canvasPan", (c) => {
                if (game.scenes.get(c.scene.id).isView) {
                    PinCushion.autoScaleNotes(c);
                }
            });
        });
    }
});

/* ------------------------------------ */
/* When ready							*/
/* ------------------------------------ */

Hooks.once("ready", function () {
    if (!game.modules.get("lib-wrapper")?.active && game.user?.isGM) {
        let word = "install and activate";
        if (game.modules.get("lib-wrapper")) word = "activate";
        throw Logger.error(`Requires the 'libWrapper' module. Please ${word} it.`);
    }
    if (!game.modules.get("socketlib")?.active && game.user?.isGM) {
        let word = "install and activate";
        if (game.modules.get("socketlib")) word = "activate";
        throw Logger.error(`Requires the 'socketlib' module. Please ${word} it.`);
    }
    // Instantiate PinCushion instance for central socket request handling
    // game.pinCushion = new PinCushion();

    // 2024-05-01... work but i don't like...
    /*
    libWrapper.register(
        CONSTANTS.MODULE_ID,
        "CONFIG.Note.objectClass.prototype._drawTooltip",
        PinCushion.drawTooltipHandler,
        "MIXED",
    );
    */
});

/**
 * Hook on note config render to inject filepicker and remove selector
 * Update Note config window with a text box to allow entry of GM-text.
 * Also replace single-line of "Text Label" with a textarea to allow multi-line text.
 * @param {NoteConfig} app    The Application instance being rendered (NoteConfig)
 * @param {jQuery} html       The inner HTML of the document that will be displayed and may be modified
 * @param {object] data       The object of data used when rendering the application (from NoteConfig#getData)
 */
Hooks.on("renderNoteConfig", async (app, html, noteData) => {
    let noteElement;
      const $html = ensureJquery(html);
    if(game.release.generation < 13){
        noteElement= app.object
    }
    else{
        noteElement = app.document
    }
    if (!noteElement.flags[CONSTANTS.MODULE_ID]) {
        // TODO WHY IS THIS NOT WORKING ??
        // setProperty(app.object.flags[CONSTANTS.MODULE_ID], {});
        noteElement.flags[CONSTANTS.MODULE_ID] = {};
    }
    let entity = noteElement.flags[CONSTANTS.MODULE_ID] || {};

    // TODO THIS CODE CAN B DONE MUCH BETTER...
    const showJournalImageByDefault = game.settings.get(CONSTANTS.MODULE_ID, "showJournalImageByDefault");

    if (
        showJournalImageByDefault &&
        noteData.document.entryId &&
        !noteElement.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.CUSHION_ICON)
    ) {
        // Journal id
        const journal = game.journal.get(noteData.document.entryId);
        if (journal) {
            const journalEntryImage = retrieveFirstImageFromJournalId(journal.id, noteElement?.pageId, false);
            if (journalEntryImage) {
                foundry.utils.setProperty(
                    noteData.document.texture,
                    "src",
                    stripQueryStringAndHashFromPath(journalEntryImage),
                );
            }
        } else {
            Logger.warn(`The journal with id '${noteData.document.entryId}' do not exists anymore`);
        }
    }

    const defaultNoteImageOnCreate = game.settings.get(CONSTANTS.MODULE_ID, "defaultNoteImageOnCreate");

    let tmp = undefined;
    if (noteData.icon.custom) {
        tmp = stripQueryStringAndHashFromPath(noteData.icon.custom);
    } else if (noteElement.texture.src) {
        tmp = stripQueryStringAndHashFromPath(noteElement.texture.src);
    } else if (noteData.document.texture.src) {
        tmp = stripQueryStringAndHashFromPath(noteData.document.texture.src);
    }
    // TODO find a better method for the double check
    if (tmp === "icons/svg/book.svg" && noteData.icon.custom) {
        tmp = stripQueryStringAndHashFromPath(noteData.icon.custom);
    }
    if (tmp === "icons/svg/book.svg" && defaultNoteImageOnCreate) {
        tmp = stripQueryStringAndHashFromPath(defaultNoteImageOnCreate);
    }
    if (tmp === "icons/svg/book.svg" && noteData.document.texture.src) {
        tmp = stripQueryStringAndHashFromPath(noteData.document.texture.src);
    }
    const pinCushionIcon = foundry.utils.getProperty(
        noteElement.flags,
        `${CONSTANTS.MODULE_ID}.${CONSTANTS.FLAGS.CUSHION_ICON}`,
    );
    if (pinCushionIcon) {
        tmp = stripQueryStringAndHashFromPath(pinCushionIcon);
    }

    PinCushion._replaceIconSelector(app, $html, noteData, tmp);
    // Causes a bug when attempting to place an journal entry onto the canvas in Foundry 9.
    // await app.object.setFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.CUSHION_ICON, tmp);
    foundry.utils.setProperty(noteElement.flags[CONSTANTS.MODULE_ID], CONSTANTS.FLAGS.CUSHION_ICON, tmp);

    const enableNoteGM = game.settings.get(CONSTANTS.MODULE_ID, "noteGM");
    if (enableNoteGM) {
        PinCushion._addNoteGM(app, $html, noteData);
    }

    const enableJournalAnchorLink = game.settings.get(CONSTANTS.MODULE_ID, "enableJournalAnchorLink");
    if (enableJournalAnchorLink && !game.modules.get("jal")?.active) {
        // eslint-disable-next-line no-inner-declarations
        function getOptions(page, current) {
            let options = "<option></option>";
            for (const key in page?.toc) {
                const section = page.toc[key];
                options += `<option value="${section.slug}"${section.slug === current ? " selected" : ""}>${
                    section.text
                }</option>`;
            }
            return options;
        }
        // <select name="flags.anchor.slug">${getOptions(noteData.document.page, noteData.document.flags.anchor?.slug)}</select>
        // let anchorData = getProperty(noteData.document.flags, `${CONSTANTS.MODULE_ID}.${CONSTANTS.FLAGS.JAL_ANCHOR}`); // noteData.document.flags.anchor;
        let anchorData = foundry.utils.getProperty(noteData.document.flags, `anchor`); // noteData.document.flags.anchor;
        let pageData = noteData.document.page;
        // let select = $(`
        // <div class='form-group'>
        // 	<label>${Logger.i18n(`${CONSTANTS.MODULE_ID}.PageSection`)}</label>
        // 	<div class='form-fields'>
        // 		<select name="flags.${CONSTANTS.MODULE_ID}.${CONSTANTS.FLAGS.JAL_ANCHOR}.slug">
        // 			${getOptions(pageData, anchorData?.slug)}
        // 		</select>
        // 	</div>
        // </div>`);
        let select = $(`
		<div class='form-group'>
			<label>${Logger.i18n(`${CONSTANTS.MODULE_ID}.PageSection`)}</label>
			<div class='form-fields'>
				<select name="flags.anchor.slug">
					${getOptions(pageData, anchorData?.slug)}
				</select>
			</div>
		</div>`);

        const pageid = $html.find("select[name='pageId']");
        pageid.parent().parent().after(select);

        // on change of page or journal entry
        // eslint-disable-next-line no-inner-declarations
        function _updateSectionList() {
            const newjournalid = app.form.elements.entryId?.value;
            const newpageid = app.form.elements.pageId?.value;
            const journal = game.journal.get(newjournalid);
            const newpage = journal?.pages.get(newpageid);
            Logger.log(`selected page changed to ${newpageid}`);
            // getOptions(newpage, data.document.flags.anchor?.slug))
            Logger.log("new options =" + getOptions(newpage, anchorData?.slug));
            // app.form.elements["flags.anchor.slug"].innerHTML = getOptions(newpage, data.document.flags.anchor?.slug);
            // app.form.elements[`flags.${CONSTANTS.MODULE_ID}.${CONSTANTS.FLAGS.JAL_ANCHOR}.slug`].innerHTML = getOptions(
            app.form.elements[`flags.anchor.slug`].innerHTML = getOptions(newpage, anchorData?.slug);
            // app.form.elements["flags.anchor.slug"].innerHTML
            Logger.log(
                // "new innerHtml" + app.form.elements[`flags.${CONSTANTS.MODULE_ID}.${CONSTANTS.FLAGS.JAL_ANCHOR}.slug`].innerHTML
                "new innerHtml" + app.form.elements[`flags.anchor.slug`].innerHTML,
            );
        }
        $html.find("select[name='entryId']").change(_updateSectionList);
        pageid.change(_updateSectionList);
    }

    // PinCushion._addShowImageField(app, html, noteData);
    // PinCushion._addPinIsTransparentField(app, html, noteData);
    // PinCushion._addShowOnlyToGMField(app, html, noteData);
    // PinCushion._addBackgroundField(app, html, noteData);
    // PinCushion._addHideLabel(app, html, noteData);

    // const enablePlayerIcon = game.settings.get(CONSTANTS.MODULE_ID, "playerIconAutoOverride");
    // if (enablePlayerIcon) {
    // 	PinCushion._addPlayerIconField(app, html, noteData);
    // }

    // const enableNoteTintColorLink = game.settings.get(CONSTANTS.MODULE_ID, "revealedNotes");
    // if (enableNoteTintColorLink) {
    //	PinCushion._addNoteTintColorLink(app, html, noteData);
    // }

    // PinCushion._addPreviewAsTextSnippet(app, html, noteData);
    // PinCushion._addDoNotShowJournalPreview(app, html, noteData);

    // PinCushion._addTooltipHandler(app, html, noteData);

    // TODO
    // PinCushion._addAboveFog(app, html, data);

    // Force a recalculation of the height (for the additional field)
    if (!app._minimized) {
        let pos = app.position;
        pos.height = "auto";
        app.setPosition(pos);
    }

    if (!game.user.isGM) {
        return;
    }

    // ====================================
    // General
    // ====================================
    const showImageExplicitSource = stripQueryStringAndHashFromPath(
        noteElement.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.SHOW_IMAGE_EXPLICIT_SOURCE) ?? "",
    );
    const showImage =  noteElement.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.SHOW_IMAGE) ?? false;
    const pinIsTransparent =  noteElement.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.PIN_IS_TRANSPARENT) ?? false;
    const showOnlyToGM =  noteElement.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.SHOW_ONLY_TO_GM) ?? false;

    const hasBackground =
        (app.document
            ? app.document.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.HAS_BACKGROUND)
            : app.object.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.HAS_BACKGROUND)) ?? 0;
    const ratio =
        (app.document
            ? app.document.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.RATIO_WIDTH)
            : app.object.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.RATIO_WIDTH)) ?? 1;
    const textAlwaysVisible =
        (app.document
            ? app.document.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.TEXT_ALWAYS_VISIBLE)
            : app.object.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.TEXT_ALWAYS_VISIBLE)) ?? false;
    const hideLabel =
        (app.document
            ? app.document.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.HIDE_LABEL)
            : app.object.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.HIDE_LABEL)) ?? false;

    const numberWsSuffixOnNameplate =
        (app.document
            ? app.document.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.NUMBER_WS_SUFFIX_ON_NAMEPLATE)
            : app.object.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.NUMBER_WS_SUFFIX_ON_NAMEPLATE)) ?? 0;

    const numberHsSuffixOnNameplate =
        (app.document
            ? app.document.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.NUMBER_HS_SUFFIX_ON_NAMEPLATE)
            : app.object.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.NUMBER_HS_SUFFIX_ON_NAMEPLATE)) ?? 0;
    // ====================================
    // enablePlayerIcon
    // ====================================
    const enablePlayerIcon = game.settings.get(CONSTANTS.MODULE_ID, "playerIconAutoOverride");
    // Adds fields to set player-only note icons
    // Get default values set by GM
    const defaultState = game.settings.get(CONSTANTS.MODULE_ID, "playerIconAutoOverride") ?? ``;
    const defaultPath = game.settings.get(CONSTANTS.MODULE_ID, "playerIconPathDefault") ?? ``;

    const playerIconState =
        foundry.utils.getProperty(
            noteData,
            `document.flags.${CONSTANTS.MODULE_ID}.${CONSTANTS.FLAGS.PLAYER_ICON_STATE}`,
        ) ?? defaultState;
    const playerIconPath = stripQueryStringAndHashFromPath(
        foundry.utils.getProperty(
            noteData,
            `document.flags.${CONSTANTS.MODULE_ID}.${CONSTANTS.FLAGS.PLAYER_ICON_PATH}`,
        ) ?? defaultPath,
    );

    // ====================================
    // revealedNotes
    // ====================================
    const enableNoteTintColorLink = game.settings.get(CONSTANTS.MODULE_ID, "revealedNotes");
    let pinIsRevealed =
        foundry.utils.getProperty(
            noteData,
            `document.flags.${CONSTANTS.MODULE_ID}.${CONSTANTS.FLAGS.PIN_IS_REVEALED}`,
        ) ?? true;
    // Check box for REVEALED state
    let usePinIsRevealed =
        foundry.utils.getProperty(
            noteData,
            `document.flags.${CONSTANTS.MODULE_ID}.${CONSTANTS.FLAGS.USE_PIN_REVEALED}`,
        ) ?? false;

    // ====================================
    // Tooltip
    // ====================================

    let doNotShowJournalPreviewS = String(
        app.document
            ? app.document.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.DO_NOT_SHOW_JOURNAL_PREVIEW)
            : app.object.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.DO_NOT_SHOW_JOURNAL_PREVIEW),
    );
    if (doNotShowJournalPreviewS !== "true" && doNotShowJournalPreviewS !== "false") {
        if (game.settings.get(CONSTANTS.MODULE_ID, "enableTooltipByDefault")) {
            doNotShowJournalPreviewS = "false";
        } else {
            doNotShowJournalPreviewS = "true";
        }
    }
    const doNotShowJournalPreview = String(doNotShowJournalPreviewS) === "true";

    const previewAsTextSnippet =
        (app.document
            ? app.document.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.PREVIEW_AS_TEXT_SNIPPET)
            : app.object.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.PREVIEW_AS_TEXT_SNIPPET)) ?? false;

    const tooltipPlacement =
        (app.document
            ? app.document.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.TOOLTIP_PLACEMENT)
            : app.object.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.TOOLTIP_PLACEMENT)) ?? "e";

    const tooltipColor =
        (app.document
            ? app.document.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.TOOLTIP_COLOR)
            : app.object.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.TOOLTIP_COLOR)) ?? "";

    const tooltipForceRemove =
        (app.document
            ? app.document.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.TOOLTIP_FORCE_REMOVE)
            : app.object.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.TOOLTIP_FORCE_REMOVE)) ?? false;

    const tooltipSmartPlacement =
        (app.document
            ? app.document.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.TOOLTIP_SMART_PLACEMENT)
            : app.object.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.TOOLTIP_SMART_PLACEMENT)) ?? false;

    const tooltipFollowMouse =
        (app.document
            ? app.document.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.TOOLTIP_FOLLOW_MOUSE)
            : app.object.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.TOOLTIP_FOLLOW_MOUSE)) ?? false;

    const tooltipPlacementHtml = `
		<select
		id="pin-cushion-tooltip-placement"
		style="width: 100%;"
		name="flags.${CONSTANTS.MODULE_ID}.${CONSTANTS.FLAGS.TOOLTIP_PLACEMENT}">
		<option
			value="nw-alt"
			${tooltipPlacement === "nw-alt" ? "selected" : ""}>
			${Logger.i18n("pin-cushion.Tooltip.Placement.choices.north-west-alt")}
		</option>
		<option
			value="nw"
			${tooltipPlacement === "nw" ? "selected" : ""}>
			${Logger.i18n("pin-cushion.Tooltip.Placement.choices.north-west")}
		</option>
		<option
			value="n"
			${tooltipPlacement === "n" ? "selected" : ""}>
			${Logger.i18n("pin-cushion.Tooltip.Placement.choices.north")}
			</option>
		<option
			value="ne"
			${tooltipPlacement === "ne" ? "selected" : ""}>
			${Logger.i18n("pin-cushion.Tooltip.Placement.choices.north-east")}
			</option>
		<option
			value="ne-alt"
			${tooltipPlacement === "ne-alt" ? "selected" : ""}>
			${Logger.i18n("pin-cushion.Tooltip.Placement.choices.north-east-alt")}
			</option>
		<option
			value="w"
			${tooltipPlacement === "w" ? "selected" : ""}>
			${Logger.i18n("pin-cushion.Tooltip.Placement.choices.west")}
			</option>
		<option
			value="e"
			${tooltipPlacement === "e" ? "selected" : ""}>
			${Logger.i18n("pin-cushion.Tooltip.Placement.choices.east")}
			</option>
		<option
			value="sw-alt"
			${tooltipPlacement === "sw-alt" ? "selected" : ""}>
			${Logger.i18n("pin-cushion.Tooltip.Placement.choices.south-west-alt")}
			</option>
		<option
			value="sw"
			${tooltipPlacement === "sw" ? "selected" : ""}>
			${Logger.i18n("pin-cushion.Tooltip.Placement.choices.south-west")}
		</option>
		<option
			value="s"
			${tooltipPlacement === "s" ? "selected" : ""}>
			${Logger.i18n("pin-cushion.Tooltip.Placement.choices.south")}
		</option>
		<option
			value="se"
			${tooltipPlacement === "se" ? "selected" : ""}>
			${Logger.i18n("pin-cushion.Tooltip.Placement.choices.south-east")}
		</option>
		<option
			value="se-alt"
			${tooltipPlacement === "se-alt" ? "selected" : ""}>
			${Logger.i18n("pin-cushion.Tooltip.Placement.choices.south-east-alt")}
		</option>
		</select>
	`;
    const tooltipColorHtml = `
	<select
		id="pin-cushion-tooltip-color"
		style="width: 100%;"
		name="flags.${CONSTANTS.MODULE_ID}.${CONSTANTS.FLAGS.TOOLTIP_COLOR}">
		<option
		value="" ${tooltipColor === "" ? "selected" : ""}>
			${Logger.i18n("pin-cushion.Tooltip.Color.choices.default")}
		</option>
		<option
		value="blue"
		${tooltipColor === "blue" ? "selected" : ""}>
			${Logger.i18n("pin-cushion.Tooltip.Color.choices.blue")}
		</option>
		<option
		value="dark"
		${tooltipColor === "dark" ? "selected" : ""}>
			${Logger.i18n("pin-cushion.Tooltip.Color.choices.dark")}
		</option>
		<option
		value="green"
		${tooltipColor === "green" ? "selected" : ""}>
			${Logger.i18n("pin-cushion.Tooltip.Color.choices.green")}
		</option>
		<option
		value="light"
		${tooltipColor === "light" ? "selected" : ""}>
			${Logger.i18n("pin-cushion.Tooltip.Color.choices.light")}
		</option>
		<option
		value="orange"
		${tooltipColor === "orange" ? "selected" : ""}>
			${Logger.i18n("pin-cushion.Tooltip.Color.choices.orange")}
		</option>
		<option value="purple"
		${tooltipColor === "purple" ? "selected" : ""}>
			${Logger.i18n("pin-cushion.Tooltip.Color.choices.purple")}
		</option>
		<option
		value="red"
		${tooltipColor === "red" ? "selected" : ""}>
			${Logger.i18n("pin-cushion.Tooltip.Color.choices.red")}
		</option>
		<option
		value="yellow"
		${tooltipColor === "yellow" ? "selected" : ""}>
			${Logger.i18n("pin-cushion.Tooltip.Color.choices.yellow")}
		</option>
	</select>
	`;

    const tooltipCustomDescription =
        (app.document
            ? app.document.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.TOOLTIP_CUSTOM_DESCRIPTION)
            : app.object.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.TOOLTIP_CUSTOM_DESCRIPTION)) ?? "";

    let tooltipShowDescriptionS = String(
        app.document
            ? app.document.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.TOOLTIP_SHOW_DESCRIPTION)
            : app.object.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.TOOLTIP_SHOW_DESCRIPTION),
    );
    if (tooltipShowDescriptionS !== "true" && tooltipShowDescriptionS !== "false") {
        tooltipShowDescriptionS = "true";
    }
    const tooltipShowDescription = String(tooltipShowDescriptionS) === "true";

    let tooltipShowTitleS = String(
        app.document
            ? app.document.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.TOOLTIP_SHOW_TITLE)
            : app.object.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.TOOLTIP_SHOW_TITLE),
    );
    if (tooltipShowTitleS !== "true" && tooltipShowTitleS !== "false") {
        tooltipShowTitleS = "true";
    }
    const tooltipShowTitle = String(tooltipShowTitleS) === "true";

    // ====================================
    // Other
    // ====================================
    const enableBackgroundlessPins = game.settings.get(CONSTANTS.MODULE_ID, "enableBackgroundlessPins");

    let pinCushionData = foundry.utils.mergeObject(
        {
            yesUploadFile: game.user.can("FILES_BROWSE"),
            noUploadFile: !game.user.can("FILES_BROWSE"),
            showImageExplicitSource: showImageExplicitSource,

            showImage: showImage,
            pinIsTransparent: pinIsTransparent,
            showOnlyToGM: showOnlyToGM,
            hasBackground: hasBackground,
            ratio: ratio,
            textAlwaysVisible: textAlwaysVisible,
            hideLabel: hideLabel,
            numberWsSuffixOnNameplate: numberWsSuffixOnNameplate,
            numberHsSuffixOnNameplate: numberHsSuffixOnNameplate,
            enablePlayerIcon: enablePlayerIcon,
            playerIconState: playerIconState,
            playerIconPath: playerIconPath,

            enableNoteTintColorLink: enableNoteTintColorLink,
            pinIsRevealed: pinIsRevealed,
            usePinIsRevealed: usePinIsRevealed,

            previewAsTextSnippet: previewAsTextSnippet,
            doNotShowJournalPreview: doNotShowJournalPreview,

            tooltipPlacement: tooltipPlacement,
            tooltipColor: tooltipColor,
            tooltipForceRemove: tooltipForceRemove,
            tooltipSmartPlacement: tooltipSmartPlacement,
            tooltipFollowMouse: tooltipFollowMouse,

            enableBackgroundlessPins: enableBackgroundlessPins,
            enableNoteGM: enableNoteGM,

            tooltipColorHtml: tooltipColorHtml,
            tooltipPlacementHtml: tooltipPlacementHtml,

            tooltipCustomDescription: tooltipCustomDescription,
            tooltipShowDescription: tooltipShowDescription,
            tooltipShowTitle: tooltipShowTitle,
        },
         noteElement.flags[CONSTANTS.MODULE_ID] || {},
    );
    // pinCushionData.entity = JSON.stringify(entity);
    // eslint-disable-next-line no-undef
    let noteHtml = await renderTemplate(`modules/${CONSTANTS.MODULE_ID}/templates/note-config.html`, pinCushionData);

 const body = $html.find(".form-body.standard-form.scrollable");

  if (body.length) {
    body.append(noteHtml);
  } else {
    console.warn("form-body container not found in NoteConfig HTML");
  }

    // START LISTENERS

    // html.find("button.file-picker-showImageExplicitSource").each(
    // 	(i, button) => (button.onclick = app._activateFilePicker.bind(app))
    // );

   // $('button[data-target="flags.pin-cushion.showImageExplicitSource"]', html).on(
  //     "click",
 ///       app._activateFilePicker.bind(app),
//    );

 //   $('button[data-target="flags.pin-cushion.PlayerIconPath"]', html).on("click", app._activateFilePicker.bind(app));

    const iconCustomSelectorExplicit = $html.find(
        `input[name='flags.${CONSTANTS.MODULE_ID}.${CONSTANTS.FLAGS.SHOW_IMAGE_EXPLICIT_SOURCE}']`,
    );
    if (iconCustomSelectorExplicit?.length > 0) {
        iconCustomSelectorExplicit.on("change", function () {
            const p = iconCustomSelectorExplicit.parent().find(".pin-cushion-explicit-icon");
            p[0].src = this.value;
        });
    }

    const iconCustomPlayerIconPath = $html.find(
        `input[name='flags.${CONSTANTS.MODULE_ID}.${CONSTANTS.FLAGS.PLAYER_ICON_PATH}']`,
    );
    if (iconCustomPlayerIconPath?.length > 0) {
        iconCustomPlayerIconPath.on("change", function () {
            const p = iconCustomPlayerIconPath.parent().find(".pin-cushion-journal-icon");
            p[0].src = this.value;
        });
    }

    const iconCustomPageIcon = $html.find(`select[name='pageId']`);
    if (iconCustomPageIcon?.length > 0) {
        iconCustomPageIcon.on("change", function () {
            const p = iconCustomPageIcon.parent().find(".pin-cushion-page-icon");
            const pageId = this.value;
            if ($html.find(`select[name='entryId']`).length > 0) {
                const entryId = $html.find(`select[name='entryId']`)[0].value;
                const firstImageFromPage = retrieveFirstImageFromJournalId(entryId, pageId, true);
                if (firstImageFromPage) {
                    p[0].src = firstImageFromPage;
                }
            }
        });
    }

    // ENDS LISTENERS
   // app.options.tabs = [{ navSelector: ".tabs", contentSelector: "form", initial: "basic" }];
    //app.options.height = "auto";
    //app._tabs = app._createTabHandlers();
    //const el = $html[0];
   // app._tabs.forEach((t) => t.bind(el));
//
 //   app.setPosition();
    /*
	// Force a recalculation of the height
	if (!app._minimized) {
		let pos = app.position;
		pos.height = "auto";
		app.setPosition(pos);
	}
	*/
});

/**
 * Hook on render HUD
 */
Hooks.on("renderHeadsUpDisplay", (app, html, data) => {
    // VERSION 1 TOOLTIP
      const $html = ensureJquery(html);
    $html.append(`<template id="pin-cushion-hud"></template>`);
    canvas.hud.pinCushion = new PinCushionHUD();
    // VERSION 2 TOOLTIP
    // html.append(`<template id="pin-cushion-hud-v2"></template>`);
    // canvas.hud.pinCushionV2 = new PinCushionHUDV2();
});

/**
 * Hook on Note hover
 */
Hooks.on("hoverNote", (note, hovered) => {
    // const showPreview = game.settings.get(CONSTANTS.MODULE_ID, 'showJournalPreview');
    const previewDelay = game.settings.get(CONSTANTS.MODULE_ID, "previewDelay");
    let doNotShowJournalPreviewS = String(
        foundry.utils.getProperty(
            note,
            `document.flags.${CONSTANTS.MODULE_ID}.${CONSTANTS.FLAGS.DO_NOT_SHOW_JOURNAL_PREVIEW}`,
        ),
    );
    if (doNotShowJournalPreviewS !== "true" && doNotShowJournalPreviewS !== "false") {
        doNotShowJournalPreviewS = "true";
    }
    const doNotShowJournalPreview = String(doNotShowJournalPreviewS) === "true" ? true : false;
    if (doNotShowJournalPreview) {
        return;
    }

    let tooltipForceRemoveS = String(
        foundry.utils.getProperty(
            note,
            `document.flags.${CONSTANTS.MODULE_ID}.${CONSTANTS.FLAGS.TOOLTIP_FORCE_REMOVE}`,
        ),
    );
    if (tooltipForceRemoveS !== "true" && tooltipForceRemoveS !== "false") {
        tooltipForceRemoveS = "false";
    }
    const tooltipForceRemove = String(tooltipForceRemoveS) === "true" ? true : false;

    // VERSION 1 TOOLTIP

    if (!hovered) {
        clearTimeout(API.pinCushion.hoverTimer);
        if (tooltipForceRemove) {
            $("#powerTip").remove();
        }
        return canvas.hud.pinCushion.clear();
    }

    // If the note is hovered by the mouse cursor (not via alt/option)
    if (hovered) {
        // TODO && note.mouseInteractionManager.state === 1
        API.pinCushion.hoverTimer = setTimeout(function () {
            canvas.hud.pinCushion.bind(note);
        }, previewDelay);
        return;
    } else {
        // THis code should be never reached
        if (!hovered) {
            clearTimeout(API.pinCushion.hoverTimer);
            return canvas.hud.pinCushion.clear();
        }
    }

    // VERSION 2 TOOLTIP
    /*
    // If the note is hovered by the mouse cursor (not via alt/option)
    if (hovered ) { // TODO && note.mouseInteractionManager.state === 1
		canvas.hud.pinCushionV2.bind(note)
	} else {
		canvas.hud.pinCushionV2.clear()
	}
	*/
});

/**
 * Hook on render Journal Directory
 */
Hooks.on("renderJournalDirectory", (app, html, data) => {
    PinCushion._addJournalThumbnail(app, html, data);
    PinCushion._addJournalDirectoryPages(app, html, data);
});

Hooks.on("deleteJournalEntryPage", () => {
    PinCushion._deleteJournalDirectoryPagesEntry();
});

Hooks.on("createJournalEntryPage", () => {
    PinCushion._createJournalDirectoryPagesEntry();
});

Hooks.on("renderJournalSheet", (app, html, data) => {
    PinCushion._renderJournalThumbnail(app, html);
});

Hooks.once("canvasInit", () => {
    // This module is only required for GMs (game.user accessible from 'ready' event but not 'init' event)
    if (game.user.isGM && game.settings.get(CONSTANTS.MODULE_ID, "noteGM")) {
        if (foundry.utils.isNewerVersion("12", game.version)) {
            libWrapper.register(
                CONSTANTS.MODULE_ID,
                "Note.prototype.text",
                PinCushion._textWithNoteGM,
                libWrapper.MIXED,
            );
        } else {
            libWrapper.register(
                CONSTANTS.MODULE_ID,
                "NoteDocument.prototype.label",
                PinCushion._labelWithNoteGM,
                libWrapper.MIXED,
            );
        }
        // https://github.com/farling42/fvtt-gmtext-in-notes/commit/762f455e280f156d6307c5e6409e424dd23cc6c8
        /*
        libWrapper.register(
            CONSTANTS.MODULE_ID,
            "Note.prototype._drawTooltip",
            PinCushion._addDrawTooltipWithNoteGM,
            "WRAPPER",
        );
        */
    } else {
        libWrapper.register(
            CONSTANTS.MODULE_ID,
            "Note.prototype._refreshTooltip",
            PinCushion._addDrawTooltip2,
            "MIXED",
        );
    }

    libWrapper.register(CONSTANTS.MODULE_ID, "Note.prototype._applyRenderFlags", PinCushion._applyRenderFlags, "MIXED");

    libWrapper.register(CONSTANTS.MODULE_ID, "Note.prototype.refresh", PinCushion._noteRefresh, "WRAPPER");

    libWrapper.register(CONSTANTS.MODULE_ID, "Note.prototype._onUpdate", PinCushion._noteUpdate, "WRAPPER");

    libWrapper.register(CONSTANTS.MODULE_ID, "Note.prototype.isVisible", PinCushion._isVisible, "MIXED");

    libWrapper.register(
        CONSTANTS.MODULE_ID,
        "Note.prototype._drawControlIcon",
        PinCushion._drawControlIcon,
        "OVERRIDE",
    );

    libWrapper.register(CONSTANTS.MODULE_ID, "Note.prototype._canControl", PinCushion._canControl, "MIXED");
});

Hooks.on("renderSettingsConfig", (app, html, data) => {
    // Add colour pickers to the Configure Game Settings: Module Settings menu
    let name, colour;
    name = `${CONSTANTS.MODULE_ID}.revealedNotesTintColorLink`;
    colour = game.settings.get(CONSTANTS.MODULE_ID, "revealedNotesTintColorLink");
    $("<input>")
        .attr("type", "color")
        .attr("data-edit", name)
        .val(colour)
        .insertAfter($(`input[name="${name}"]`, html).addClass("color"));

    name = `${CONSTANTS.MODULE_ID}.revealedNotesTintColorNotLink`;
    colour = game.settings.get(CONSTANTS.MODULE_ID, "revealedNotesTintColorNotLink");
    $("<input>")
        .attr("type", "color")
        .attr("data-edit", name)
        .val(colour)
        .insertAfter($(`input[name="${name}"]`, html).addClass("color"));

    name = `${CONSTANTS.MODULE_ID}.revealedNotesTintColorRevealed`;
    colour = game.settings.get(CONSTANTS.MODULE_ID, "revealedNotesTintColorRevealed");
    $("<input>")
        .attr("type", "color")
        .attr("data-edit", name)
        .val(colour)
        .insertAfter($(`input[name="${name}"]`, html).addClass("color"));

    name = `${CONSTANTS.MODULE_ID}.revealedNotesTintColorNotRevealed`;
    colour = game.settings.get(CONSTANTS.MODULE_ID, "revealedNotesTintColorNotRevealed");
    $("<input>")
        .attr("type", "color")
        .attr("data-edit", name)
        .val(colour)
        .insertAfter($(`input[name="${name}"]`, html).addClass("color"));
});

// This runs only on canvas drop and after the renderNoteConfig hook above.
// It ensures that we have fill the html of the NoteConfig window with the correct data on first drop.
Hooks.on("dropCanvasData", (canvas, data) => {
    const enableJournalAnchorLink = game.settings.get(CONSTANTS.MODULE_ID, "enableJournalAnchorLink");
    if (enableJournalAnchorLink && !game.modules.get("jal")?.active) {
        if (!(data.type === "JournalEntryPage" && data.anchor)) {
            return;
        }
        const { anchor } = data;

        Hooks.once("renderNoteConfig", (_, html, { label }) => {
            html.find("input[name='text']").val(`${label}: ${anchor.name}`);
            html.find(`option[value=${anchor.slug}]`).attr("selected", true);
        });
    }
});

// Why doesn't this just exist in core foundry?
Hooks.on("activateNote", (note, options) => {
    const enableJournalAnchorLink = game.settings.get(CONSTANTS.MODULE_ID, "enableJournalAnchorLink");
    if (enableJournalAnchorLink && !game.modules.get("jal")?.active) {
        // let anchorData = foundry.utils.getProperty(note, `document.flags.${CONSTANTS.MODULE_ID}.${CONSTANTS.FLAGS.JAL_ANCHOR}`);
        let anchorData = foundry.utils.getProperty(note, `document.flags.anchor.slug`);
        options.anchor = anchorData?.slug;
        // options.anchor = note.document.flags.anchor?.slug;
    }
});
function ensureJquery(html) {
  // If it's already jQuery, return it
  if (html instanceof jQuery) return html;

  // If it's an HTMLElement, convert it
  if (html instanceof HTMLElement) return $(html);

  // If it's something else, wrap it anyway (fallback)
  return $(html);
}

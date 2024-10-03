import { Notice, Plugin, TFile } from "obsidian";

interface ExamplePluginSettings {
	appendingDestination: string | null;
}

const DEFAULT_SETTINGS: ExamplePluginSettings = {
	appendingDestination: null,
};

export default class ExamplePlugin extends Plugin {
	settings: ExamplePluginSettings;

	async onload() {
		// Load plugin settings
		await this.loadSettings();

		// Register a new file menu option to set the appending destination
		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				menu.addItem((item) => {
					item.setTitle("Set As Appending Destination")
						.setIcon("document")
						.onClick(async () => {
							this.setAppendingDestination(file);
						});
				});
			}),
		);

		// Register the command to append selected text
		this.addCommand({
			id: "append-selection-to-the-destination-file",
			name: "Append selection to the destination file",
			editorCallback: async (editor, view) => {
				const selectedText = editor.getSelection();
				if (selectedText) {
					this.appendToDestination(selectedText);
				} else {
					new Notice("No text selected.");
				}
			},
		});

		this.addCommand({
			id: "append-current-line-to-the-destination-file",
			name: "Append current line to the destination file",
			editorCallback: async (editor, view) => {
				const currentLine = editor.getLine(editor.getCursor().line);
				if (currentLine) {
					this.appendToDestination(currentLine);
				} else {
					new Notice("No line to append.");
				}
			},
		});
	}

	// Set the file as the appending destination
	async setAppendingDestination(file: TFile) {
		this.settings.appendingDestination = file.path;
		await this.saveSettings();
		new Notice(`Set ${file.path} as appending destination.`);
	}

	// Append text to the selected file
	async appendToDestination(text: string) {
		if (!this.settings.appendingDestination) {
			new Notice("No appending destination set.");
			return;
		}

		const file = this.app.vault.getAbstractFileByPath(
			this.settings.appendingDestination,
		);
		if (file instanceof TFile) {
			const fileContents = await this.app.vault.read(file);
			const newContents = fileContents + "\n" + text;
			await this.app.vault.modify(file, newContents);
			new Notice("Text appended to file.");
		} else {
			new Notice("Error: Could not find the file.");
		}
	}

	// Load plugin settings
	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	// Save plugin settings
	async saveSettings() {
		await this.saveData(this.settings);
	}
}

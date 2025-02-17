﻿
import { api } from "../../../scripts/api.js";
import { app } from "../../../scripts/app.js";
import { $el } from "../../../scripts/ui.js";
import { lightbox } from "./common/lightbox.js";

$el("style", {
	textContent: `
		:root {
			--background-color-main: rgb(36, 39, 48);
			--separator-color: yellow;
			--separator-width: 2px;
			--border-color: #ccc; 
			--input-bg-color: #eee; 
			--text-color: #333; 
			--highlight-filter: brightness(1.2);
			--feed-height: 300px; 
			--feed-width: 100%; 
		}

		.tb-image-feed {
			position: fixed;
			display: flex;
			background-color: var(--background-color-main);
			padding: 5px;
			z-index: 500;  
			transition: all 0.3s ease;
			border: 1px solid var(--border-color);
			height: var(--feed-height);
			width: 100%;

		}

		.tb-image-feed--bottom {
			left: 0;
			right: 0;
			flex-direction: row;
			bottom: 0;
		}

		.tb-image-feed--top {
			left: 0;
			right: 0;
			flex-direction: row;
			top: 0;
		}

		.tb-image-feed-list {
			display: flex;
			flex-direction: row; 
			gap: 4px;
			align-items: flex-start; 
			white-space: nowrap; 
			overflow-x: scroll; 
			overflow-y: hidden; 
			scrollbar-gutter: stable;
			scrollbar-width: auto;
			max-height: inherit;
			max-width: inherit;
			height: inherit;
			width: inherit;
			z-index: 501;
		}

		.tb-image-feed-list > * {
			flex-shrink: 0;
		}	

		.image-batch-container {
			display: flex;
			flex-direction: row;
			gap: 2px;
			align-items: center;
			max-height: inherit;
			height: inherit;
			overflow: hidden; 
			white-space: nowrap; 
			flex-wrap: nowrap; 
		}

		.image-container {
			display: flex;
			justify-content: center;
			align-items: center;
			overflow: hidden;
			max-height: inherit;
			height: inherit;
			z-index: 501; /* For some reason some text controls have a zindex of 100??? */
		}

		.image-container a {
			display: flex; 
			max-height: inherit; 
			height: inherit;
		}		

		.image-container img {
			max-height: inherit; 
			height: inherit;
			width: auto;
			object-fit: contain; 
		}

		.image-feed-vertical-bar {
			height: 100%;
			width: 4px;
			background-color: yellow;
			display: inline-block
			z-index: 502; /*For some reason some text controls have a zindex of 100??? */
		}

		.tb-image-feed-btn-group {
			position: fixed;
			bottom: 10px;
			right: 10px;
			display: flex;
			flex-direction: row; 
			align-items: center; 
			justify-content: space-between; 
			gap: 5px; 
			height: auto;
			width: auto;
			z-index:502;
		}

		.tb-image-feed-btn-group--top {
			bottom: unset;
			top: 5px;
			right: 40px;
		}

		.tb-image-feed-btn-group--bottom {
			bottom: 30px;
			right: 10px;
			top: unset;
		}

		.tb-image-feed-btn {
			padding: 0 10px;
			font-size: 16px;
			height: 40px;
			width: 70px; 
			display: flex;
			align-items: center;
			justify-content: center;
			border: 1px solid var(--border-color);
			border-radius: 5px;
			background-color: white; 
			color: var(--text-color);
			cursor: pointer;
		}

		.tb-image-feed-btn:hover {
			filter: var(--highlight-filter);
		}

		.tb-image-feed-btn:active {
			position: relative;
			top: 1px;
		}

		.tb-close-btn {
			position: absolute;
			top: 5px;
			right: 10px;
			padding: 0 10px;
			font-size: 16px;
			height: 30px; 
			width: 30px; 
			display: flex;
			align-items: center;
			justify-content: center;
			border: 1px solid var(--border-color);
			border-radius: 5px;
			color: var(--text-color);
			cursor: pointer;
			z-index: 600;
		}

		.tb-close-btn:hover {
			filter: var(--highlight-filter);
		}

		.tb-close-btn:active {
			position: relative;
			top: 1px;
		}

		.modalOverlay {
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background-color: rgba(0, 0, 0, 0.5);
			display: flex;
			justify-content: center;
			align-items: center;
			z-index: 9999;
		}

		.nodeSelectorPlaceholder {
			background-color: #000;
			color: #FFF;
			padding: 20px;
			border: 2px solid var(--separator-color);
			border-radius: 10px;
			box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
			position: fixed;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			max-width: 600px;
			max-height: 80vh;
			overflow-y: auto;
			z-index: 10000;
		}

		.node-list-item {
			display: flex;
			align-items: center;
			margin-bottom: 10px;
			background-color: #111;
			padding: 10px;
			border-radius: 5px;
		}

		.node-list-item:nth-child(odd) {
			background-color: #000;
		}

		.custom-node-item {
			display: flex;
			align-items: center;
			margin-bottom: 10px;
			margin-top: 20px;
			padding: 10px;
			border-radius: 5px;
			background-color: #000;
			border: 1px solid yellow;  
		}

		.custom-label {
			/* Assuming default color is white and gets greyed out when disabled */
			color: #FFF;
		}

		.custom-label.disabled {
			color: #555;
		}`,
	parent: document.body,
});

app.registerExtension({
	name: "simpleTray.ImageFeed",
	async setup() {
		let visible = true;

		/*
		const showButton = $el("button.comfy-settings-btn", {
			textContent: "📥",
			id: "imageTrayShowButton",
			style: {
				right: "16px",
				cursor: "pointer",
				display: "none",
			},
		});

		let showMenuButton;
		if (!app.menu?.element.style.display && app.menu?.settingsGroup) {
			showMenuButton = new (await import("../../../scripts/ui/components/button.js")).ComfyButton({
				icon: "image-multiple",
				action: () => showButton.click(),
				tooltip: "Show Image Tray 📥",
				content: "Show Image Tray 📥",
			});
			showMenuButton.enabled = false;
			app.menu.settingsGroup.append(showMenuButton);
		}
		*/

		const prefix = "simpleTray.ImageFeed.";
		const comfyPrefix = "Comfy.Settings." + prefix;

		//Legacy getter and setter - for accessing the settings from the menu setting system.
		const getVal = (n, d) => {
			const v = localStorage.getItem(comfyPrefix + n);

			if (v === null) {
				return d;
			}
			return v.replace(/^"|"$/g, ''); //Whoever wrote the string handling code in the API - Do you have any idea how long I spent debugging this?
											//Stupid problems get stupid solutions.
		};

		const saveVal = (n, v) => {
			const valueToSave = (typeof v === "boolean") ? v.toString() : v;
			localStorage.setItem(prefix + n, valueToSave);
		};


		const getJSONVal = (n, d) => {
			const v = localStorage.getItem(prefix + n);
			if (v === null) {
				return d;
			}
			try {
				return JSON.parse(v);
			} catch (error) {
				return d;
			}
		};

		const saveJSONVal = (n, v) => {
			try {
				localStorage.setItem(prefix + n, JSON.stringify(v));
			} catch (error) {
				console.error("Error saving to localStorage", error);
			}
		};

		visible = getJSONVal("Visible", true);

		const imageFeed = $el("div", { className: "tb-image-feed", parent: document.body });
		const imageList = $el("div", { className: "tb-image-feed-list" });
		const buttonPanel = $el("div", { className: "tb-image-feed-btn-group" });

		//TODO: Build this list programmatically somehow. In the meantime, update it with image nodes.
		const eligibleNodes = ['SaveImage', 'PreviewImage', 'KSampler', 'KSampler (Efficient)', 'KSampler Adv. (Efficient)', 'KSampler SDXL (Eff.)'];

		let sortOrder = getJSONVal("SortOrder", "ID");
		let selectedNodeIds = getJSONVal("NodeFilter", []);
		let imageNodes;

		let filterToggleButton;
		let sortToggleButton;

		let currentBatchIdentifier;
		let currentBatchContainer;

		const clearButton = $el("button.tb-image-feed-btn.clear-btn", {
			textContent: "Clear",
			onclick: () => {

				currentBatchIdentifier = null;
				currentBatchContainer.replaceChildren(); //Clear the current batch container
				imageList.replaceChildren();			 //Clear the contents of the imageList.
				window.dispatchEvent(new Event("resize"));
			},
		});
/*
		const closeButton = $el("button.tb-close-btn", {
			textContent: "❌",
			onclick: () => {
				visible = false;
				imageFeed.style.display = "none";
				showButton.style.display = "unset";
				saveJSONVal("Visible", visible);
				window.dispatchEvent(new Event("resize"));
				if (showMenuButton) {
					showMenuButton.disabled = false;
				}
			},
		});
*/
		const nodeFilterButton = $el("button.tb-image-feed-btn.node-filter-btn", {
			textContent: "Node Filter",
			onclick: () => {
				const overlay = loadModal();
				createImageNodeList();
				setNodeSelectorVisibility(true);
			},
		});

		function updateControlPositions(feedLocation) {
			if (!imageFeed) {
				console.error('Image feed element not found.');
				return;
			}

			imageFeed.classList.remove('tb-image-feed--top', 'tb-image-feed--bottom');

			if (feedLocation === 'top') {
				imageFeed.classList.add('tb-image-feed--top');
			} else if (feedLocation === 'bottom') {
				imageFeed.classList.add('tb-image-feed--bottom');
			}

			buttonPanel.classList.remove('tb-image-feed-btn-group--top', 'tb-image-feed-btn-group--bottom')

			if (feedLocation === 'top') {
				buttonPanel.classList.add('tb-image-feed-btn-group--top');
			} else if (feedLocation === 'bottom') {
				buttonPanel.classList.add('tb-image-feed-btn-group--bottom');
			}
			return;
		}

		function createElement(type, options = {}) {
			const element = document.createElement(type);
			for (const [key, value] of Object.entries(options)) {
				if (key === 'style') {
					Object.assign(element.style, value);
				} else if (key === 'classList') {
					value.forEach(className => element.classList.add(className));
				} else {
					element[key] = value;
				}
			}
			return element;
		}
		function updateImageNodes() {
			const nodes = Object.values(app.graph._nodes);
			const filteredNodes = [];
			const discardedNodes = [];

			nodes.forEach(node => {
				if (eligibleNodes.includes(node.type)) {
					filteredNodes.push(node);
				} else {
					discardedNodes.push(node);
				}
			});

			imageNodes = filteredNodes;
			return;
		}

		function updateSelectedNodeIds(nodeId, isChecked) {
			if (isChecked) {
				if (!selectedNodeIds.includes(nodeId)) {
					selectedNodeIds.push(nodeId);
				}
			} else {
				selectedNodeIds = selectedNodeIds.filter(id => id !== nodeId);
			}

			localStorage.setItem("simpleTray.ImageFeed.NodeFilter", JSON.stringify(selectedNodeIds));
		}

		function loadModal() {
			const overlay = loadOverlay();

			let modal = document.getElementById('nodeSelectorPlaceholder');
			if (!modal) {
				modal = createElement('div', { id: 'nodeSelectorPlaceholder', classList: ['nodeSelectorPlaceholder'] });
				overlay.appendChild(modal);
			}
			return modal;
		}

		function loadOverlay() {
			let overlay = document.getElementById('modalOverlay');

			if (!overlay) {
				overlay = createElement('div', { id: 'modalOverlay', classList: ['modalOverlay'] });
				document.body.appendChild(overlay);
				overlay.addEventListener('click', event => {
					if (event.target === overlay) {
						setNodeSelectorVisibility(false);
					}
				});
			}

			return overlay;
		}

		function toggleFilter() {
			let filterEnabled = getJSONVal("FilterEnabled", false);

			filterEnabled = !filterEnabled;
			filterToggleButton.textContent = filterEnabled ? 'Disable Filter' : 'Enable Filter';
			sortToggleButton.disabled = !filterEnabled;
			saveJSONVal("FilterEnabled", filterEnabled);
			redrawImageNodeList();

		}

		function toggleSortOrder() {
			sortOrder = getJSONVal("SortOrder", "ID");
			sortOrder = sortOrder === "ID" ? "Name" : "ID";
			saveJSONVal("SortOrder", sortOrder);
			sortToggleButton.textContent = sortOrder === "ID" ? 'Sort by Name' : 'Sort by ID';
			redrawImageNodeList(imageNodes, loadModal());
		}

		function sortImageNodes() {
			sortOrder = getJSONVal("SortOrder", "ID");

			if (!imageNodes) {
				updateImageNodes();
			}

			imageNodes.sort((a, b) => {
				if (sortOrder === "Name") {
					if (a.title < b.title) return -1;
					if (a.title > b.title) return 1;
					// Subsort by ID if names are equal
					return a.id - b.id;
				} else {
					return a.id - b.id;
				}
			});
		}

		function redrawImageNodeList() {
			let listContainer = loadModal();
			let list = listContainer.querySelector('ul');

			if (!list) {
				list = createElement('ul', { classList: ['node-list'] });
				listContainer.appendChild(list);
			} else {
				list.innerHTML = '';
			}

			const filterEnabled = getJSONVal("FilterEnabled", false);

			updateImageNodes();
			sortImageNodes();

			imageNodes.forEach((node, index) => {
				const listItem = createElement('li', {
					classList: ['node-list-item', index % 2 === 0 ? 'even' : 'odd']
				});

				const checkbox = createElement('input', {
					type: 'checkbox',
					id: `node-${node.id}`,
					checked: selectedNodeIds.includes(node.id),
					disabled: !filterEnabled
				});

				checkbox.addEventListener('change', () => {
					updateSelectedNodeIds(node.id, checkbox.checked);
				});

				const label = createElement('label', {
					htmlFor: checkbox.id,
					textContent: node.title ? `${node.title} (ID: ${node.id})` : `Node ID: ${node.id}`
				});

				listItem.appendChild(checkbox);
				listItem.appendChild(label);
				list.appendChild(listItem);
			});

			let customNodeItem = listContainer.querySelector('.custom-node-item');
			if (!customNodeItem) {
				customNodeItem = document.createElement('li');
				customNodeItem.classList.add("custom-node-item");

				const customCheckbox = document.createElement('input');
				customCheckbox.type = 'checkbox';
				customCheckbox.id = 'custom-node-checkbox';
				customCheckbox.addEventListener('change', function () {
					updateSelectedNodeIds(-1, this.checked);
				});

				const customLabel = document.createElement('label');
				customLabel.setAttribute('for', customCheckbox.id);
				customLabel.textContent = "Custom Nodes Not Shown";
				customLabel.classList.add("custom-label");

				customNodeItem.appendChild(customCheckbox);
				customNodeItem.appendChild(customLabel);
				listContainer.appendChild(customNodeItem);
			} else {
				//If the custom node item already exists, just update its disabled state
				const customCheckbox = customNodeItem.querySelector('input[type="checkbox"]');
				if (customCheckbox) {
					customCheckbox.disabled = !filterEnabled;
				}
			}
		}

		function createImageNodeList() {
			const nodeListElement = loadModal();
			const buttonWidth = '100px';
			const header = document.createElement('h2');

			header.textContent = 'Detected Image Nodes';
			header.style.textAlign = 'center';
			header.style.color = '#FFF';
			header.style.margin = '0 0 20px';
			header.style.fontSize = '24px';

			nodeListElement.innerHTML = '';
			nodeListElement.appendChild(header);

			const line1Container = document.createElement('div');
			line1Container.style.display = 'flex';
			line1Container.style.justifyContent = 'space-between';
			line1Container.style.width = '100%';
			line1Container.style.marginBottom = '5px';

			const line2Container = document.createElement('div');
			line2Container.style.display = 'flex';
			line2Container.style.justifyContent = 'flex-end';
			line2Container.style.width = '100%';

			const filterEnabled = getJSONVal("FilterEnabled", false);

			if (!filterToggleButton) {
				filterToggleButton = document.createElement('button');
				filterToggleButton.textContent = filterEnabled ? 'Disable Filter' : 'Enable Filter';
				filterToggleButton.style.width = buttonWidth;
				filterToggleButton.addEventListener('click', toggleFilter);
			}

			if (!sortToggleButton) {
				sortToggleButton = document.createElement('button');
				sortToggleButton.style.width = buttonWidth;
				sortToggleButton.disabled = !filterEnabled;
				sortToggleButton.addEventListener('click', toggleSortOrder);
			}

			if (sortOrder === "ID") {
				sortToggleButton.textContent = 'Sort by Name';
			} else {
				sortToggleButton.textContent = 'Sort by ID';
			}

			line1Container.appendChild(filterToggleButton);
			line1Container.appendChild(sortToggleButton);
			nodeListElement.appendChild(line1Container);

			redrawImageNodeList(imageNodes, nodeListElement);
		}
		function setNodeSelectorVisibility(isVisible) {
			const modal = loadModal();
			const overlay = loadOverlay();

			if (!isVisible) {
				//Save the current state when hiding the overlay
				//There's never been a better time.
				saveJSONVal("NodeFilter", selectedNodeIds);
				redrawImageNodeList(imageNodes, loadModal());
			}

			overlay.style.display = isVisible ? 'flex' : 'none';
			return;
		}
		function onDomReady() {
			const feedVisible = app.ui.settings.addSetting({
				id: "simpleTray.imageTray.TrayVisible",
				name: "📥 Display Image Tray",
				type: "boolean",
				checked: getJSONVal("Visible", true), 
				onChange(value) {
					visible = value;
					saveJSONVal("Visible", value);
					changeFeedVisibilility(value);
				},
				tooltip: "Change the visibility of the Image Feed.",
			});

			const feedDirectionSetting = app.ui.settings.addSetting({
				id: "simpleTray.imageTray.NewestFirst",
				name: "📥 Image Tray Sort Order",
				defaultValue: "newest",
				type: "combo",
				options: () => [
					{ text: "newest first", value: "newest" },
					{ text: "oldest first", value: "oldest" }
				],
				onChange: (newOrder) => {
					//Technically we don't need to do anything.
					//We query and handle this later on.
				},
				tooltip: "Change the order in which images are displayed.",
			});

			const feedLengthSetting = app.ui.settings.addSetting({
				id: "simpleTray.imageTray.MaxFeedLength",
				name: "📥 Max Batches In Feed",
				defaultValue: 25,
				type: "number",
				onChange: (newValue) => {
					// Technically we don't need to do anything.
					// We'll remove elements during the executed event.
				},
				tooltip: "Maximum number of image batches to retain before the oldest start dropping from image feed.",
				attrs: {
					min: '25',
					max: '200',
					step: '25',
				},
			});

			const feedHeightSetting = app.ui.settings.addSetting({
				id: "simpleTray.imageTray.feedHeight",
				name: "📥 Image Tray Height",
				defaultValue: 300,
				type: "slider",
				onChange: (newValue) => {
					const newHeight = `${newValue}px`;
					imageFeed.style.setProperty('--feed-height', newHeight);
					window.dispatchEvent(new Event("resize"));
				},
				attrs: {
					min: '100',
					max: '300',
					className: 'feed-height-slider',
				},
				tooltip: "Adjust the height of the feed display area.",
			});

			const feedLocationSetting = app.ui.settings.addSetting({
				id: "simpleTray.imageTray.Location",
				name: "📥 Image Tray Location",
				defaultValue: "bottom",
				type: "combo",
				options: [
					{ text: "top", value: "top" },
					{ text: "bottom", value: "bottom" }
				],
				onChange: (newLocation) => {
					updateControlPositions(newLocation);
					window.dispatchEvent(new Event("resize"));
				},
				tooltip: "Choose the location of the image feed.",
			});

			imageFeed.append(imageList);

			//This is just the on screen interface.
			buttonPanel.append(nodeFilterButton);
			buttonPanel.append(clearButton);
			imageFeed.append(buttonPanel);
			//imageFeed.append(closeButton);

			const resizeControl = document.querySelector('.tb-image-feed-resize');
			const buttonGroup = document.querySelector('.tb-image-feed-btn-group');

			/*
			if (showButton) {
				showButton.onclick = () => {
					visible = true;
					saveJSONVal("Visible", visible);

					imageFeed.style.display = "block";
					showButton.style.display = "none";

					const showMenuButton = document.querySelector('.show-menu-button');
					if (showMenuButton) showMenuButton.disabled = true;

					window.dispatchEvent(new Event("resize"));
				};
			}
			*/
		}
		function changeFeedVisibilility(vis) {
			if (vis == true) {
				imageFeed.style.display = "block";
				const showMenuButton = document.querySelector('.show-menu-button');
			} else {
				imageFeed.style.display = "none";
			}
			window.dispatchEvent(new Event("resize"));
		}

		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", onDomReady);
		} else {
			onDomReady();
		}

		//document.querySelector(".comfy-settings-btn").after(showButton);
		window.dispatchEvent(new Event("resize"));

		//Check if the feed should be visible on startup.
		//if (!getJSONVal("Visible", true)) {
		//	closeButton.onclick();
		//}

		//TODO: If comfyui adds a 'batch finished' event, this should all be refactored.
		api.addEventListener("execution_start", ({ detail }) => {
			const filterEnabled = getJSONVal("FilterEnabled", false);

			//If the filter has no nodes selected but enabled is true, set enabled to false.
			//The design is very human. 
			if (filterEnabled && (!selectedNodeIds || selectedNodeIds.length === 0)) {
				saveJSONVal('FilterEnabled', false);
				return;
			}
		});

		api.addEventListener("executed", ({ detail }) => {
			if (!visible || !detail?.output?.images) {
				return;
			}

			const newestToOldest = getVal("NewestFirst", "newest") == "newest";
			const filterEnabled = getJSONVal("FilterEnabled", true) === true;
			const newBatchIdentifier = detail.prompt_id;

			if (detail.node?.includes?.(":")) {
				// Ignore group nodes
				const n = app.graph.getNodeById(detail.node.split(":")[0]);
				if (n?.getInnerNodes) return;
			}

			if (!imageFeed && !imageList) {
				console.error('Image feed or imageList container not found!');
				return;
			} else {
				// Start a new batch container immediately
				if (!currentBatchContainer) {
					currentBatchContainer = document.createElement('div');
					currentBatchContainer.className = 'image-batch-container';
				}

				if (newestToOldest) {
					imageList.prepend(currentBatchContainer);
				} else {
					imageList.appendChild(currentBatchContainer);
				}
			}

			if (newBatchIdentifier !== currentBatchIdentifier) {
				if (currentBatchIdentifier) {
					const yellowBar = document.createElement('div');
					yellowBar.className = "image-feed-vertical-bar";
					if (newestToOldest) {
						imageList.prepend(yellowBar);
					} else {
						imageList.appendChild(yellowBar);
					}
				}
				currentBatchContainer = document.createElement('div');
				currentBatchContainer.className = 'image-batch-container';

				if (newestToOldest) {
					imageList.prepend(currentBatchContainer);
				} else {
					imageList.appendChild(currentBatchContainer);
				}
				currentBatchIdentifier = newBatchIdentifier;
			}

			detail.output.images.forEach((src) => {
				const node = app.graph.getNodeById(parseInt(detail.node, 10));
				if (!filterEnabled || (node?.type && (eligibleNodes.includes(node.type) && selectedNodeIds.includes(parseInt(detail.node, 10))) ||
					(!eligibleNodes.includes(node.type) && selectedNodeIds.includes(-1)))) {
					addImageToBatch(src, currentBatchContainer);
				}
			});

			checkAndRemoveExtraImageBatches();
			setTimeout(() => window.dispatchEvent(new Event("resize")), 1);
		});

		//Lightbox Support
		function getAllImages() {
			const images = document.querySelectorAll('.tb-image-feed img');
			// Normalize URLs to be absolute - This is support for multibatch lightbox support.
			const imageSources = Array.from(images).map(img => new URL(img.src, window.location.origin).href);
			return imageSources;
		}

		function addImageToBatch(src, batchContainer) {
			// Construct the base and full URL with cache-busting
			const baseUrl = `./view?filename=${encodeURIComponent(src.filename)}&type=${src.type}&subfolder=${encodeURIComponent(src.subfolder)}`;
			const timestampedUrl = `${baseUrl}&t=${+new Date()}`;
			const newestToOldest = getVal("NewestFirst", "newest") === "newest";

			const imageElement = document.createElement('div');
			imageElement.className = 'image-container';
			const anchor = document.createElement('a');
			anchor.setAttribute('target', '_blank');
			anchor.setAttribute('href', timestampedUrl); // Set href to the full URL for cache busting
			anchor.onclick = (e) => {
				e.preventDefault();
				const absoluteUrl = new URL(timestampedUrl, window.location.origin).href;
				const imgs = getAllImages();
				// Normalize and compare without the `t` parameter for matching
				const normalizedUrls = imgs.map(url => url.split('&t=')[0]);
				const baseUrlAbsolute = new URL(baseUrl, window.location.origin).href;
				const imageIndex = normalizedUrls.indexOf(baseUrlAbsolute);

				if (imageIndex > -1) {
					lightbox.show(imgs, imageIndex);
				} else {
					console.error("Error: Clicked image not found in the list:", absoluteUrl);
				}
			};

			const img = document.createElement('img');
			img.setAttribute('src', timestampedUrl); // Use the full URL for the img src
			anchor.appendChild(img);
			imageElement.appendChild(anchor);

			if (newestToOldest) {

				batchContainer.prepend(imageElement);
			} else {
				batchContainer.appendChild(imageElement);
			}
		}

		function checkAndRemoveExtraImageBatches() {
			const newestToOldest = getVal("NewestFirst", "newest") === "newest";
			const maxImageBatches = getVal("MaxFeedLength", 25);

			if (!imageList) {
				console.log("Image list not found.");
				return;
			}

			let allBatches = imageList.querySelectorAll('.image-batch-container');

			while (allBatches.length > maxImageBatches) {
				const elementToRemove = newestToOldest ? allBatches[allBatches.length - 1] : allBatches[0];
				const yellowBarToRemove = newestToOldest ? elementToRemove.previousElementSibling : elementToRemove.nextElementSibling;

				if (yellowBarToRemove && yellowBarToRemove.className === "image-feed-vertical-bar") {
					imageList.removeChild(yellowBarToRemove);
				}
				imageList.removeChild(elementToRemove);

				allBatches = imageList.querySelectorAll('.image-batch-container');
			}
		}
	},
});

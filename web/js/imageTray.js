﻿/**
 * This project is based on the imagetray from the ComfyUI - Custom Scripts project
 * Repository: https://github.com/pythongosssss/ComfyUI-Custom-Scripts
 * License: MIT License
 * Author: pythongosssss
 *
 */

import { api } from "../../../scripts/api.js";
import { app } from "../../../scripts/app.js";
import { $el } from "../../../scripts/ui.js";

class Lightbox {
  #el;
  #img;
  #link;
  #closeBtn;
  #prev;
  #next;
  #spinner;
  #images = [];
  #index = 0;

  constructor(getImagesFunction) {
    this.getImages = getImagesFunction;
    this.#createElements();
    this.#addEventListeners();
  }

  #createElements() {
    this.#el = this.#createElement("div", "lightbox");
    this.#closeBtn = this.#createElement("div", "lightbox__close", this.#el);
    this.#prev = this.#createElement("div", "lightbox__prev", this.#el);
    const main = this.#createElement("div", "lightbox__main", this.#el);
    this.#next = this.#createElement("div", "lightbox__next", this.#el);
    this.#link = this.#createElement("a", "lightbox__link", main, {
      target: "_blank",
    });
    this.#spinner = this.#createElement("div", "lightbox__spinner", this.#link);
    this.#img = this.#createElement("img", "lightbox__img", this.#link);
    document.body.appendChild(this.#el);
  }

  #createElement(tag, className, parent, attrs = {}) {
    const el = document.createElement(tag);
    el.className = className;
    if (parent) parent.appendChild(el);
    Object.entries(attrs).forEach(([key, value]) =>
      el.setAttribute(key, value)
    );
    return el;
  }

  #addEventListeners() {
    this.#el.addEventListener("click", (e) => {
      if (e.target === this.#el) this.close();
    });
    this.#closeBtn.addEventListener("click", () => this.close());
    this.#prev.addEventListener("click", () => this.#update(-1));
    this.#next.addEventListener("click", () => this.#update(1));
    this.#img.addEventListener("click", (e) => e.stopPropagation());
    document.addEventListener("keydown", this.#handleKeyDown.bind(this));

    // Add mouseover/hover events to check wrapping state
    this.#prev.addEventListener("mouseover", () => this.#update(0));
    this.#next.addEventListener("mouseover", () => this.#update(0));
  }

  #handleKeyDown(event) {
    if (this.#el.style.display === "none") return;
    switch (event.key) {
      case "ArrowLeft":
      case "a":
        this.#update(-1);
        break;
      case "ArrowRight":
      case "d":
        this.#update(1);
        break;
      case "Escape":
        this.close();
        break;
    }
  }

  async show(initialImages, index = 0) {
    this.#images = initialImages;
    this.#index = index;

    // Ensure the arrow states are correctly set when lightbox is opened
    await this.#update(0);

    this.#el.style.display = "flex";
    setTimeout(() => (this.#el.style.opacity = 1), 0);
  }

  close() {
    this.#el.style.opacity = 0;
    setTimeout(() => (this.#el.style.display = "none"), 200);
  }

  async #update(shift) {
    this.updateImageList(); // Refresh the image list
    let newIndex = this.#index + shift;

    // Check if wrapping will occur
    const willWrapLeft = newIndex < 0;
    const willWrapRight = newIndex >= this.#images.length;

    // Implement wrapping
    if (willWrapLeft) {
      newIndex = this.#images.length - 1; // Wrap to the end
    } else if (willWrapRight) {
      newIndex = 0; // Wrap to the beginning
    }

    this.#index = newIndex;

    // Update arrow styles based on whether wrapping will occur
    if (willWrapLeft) {
      this.#prev.classList.add("lightbox__prev--wrap");
    } else {
      this.#prev.classList.remove("lightbox__prev--wrap");
    }

    if (willWrapRight) {
      this.#next.classList.add("lightbox__next--wrap");
    } else {
      this.#next.classList.remove("lightbox__next--wrap");
    }

    const img = this.#images[this.#index];
    this.#img.style.opacity = 0;
    this.#spinner.style.display = "block";
    try {
      await this.#loadImage(img);
      this.#link.href = img;
      this.#img.src = img;
      this.#img.style.opacity = 1;
    } catch (err) {
      console.error("Failed to load image:", img, err);
      this.#img.alt = "Failed to load image";
    } finally {
      this.#spinner.style.display = "none";
    }
  }

  #loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
  }

  async updateWithNewImage(img, feedDirection) {
    if (this.#el.style.display === "none" || this.#el.style.opacity === "0")
      return;
    const [method, shift] =
      feedDirection === "newest first" ? ["unshift", 1] : ["push", 0];
    this.#images[method](img);
    await this.#update(shift);
  }

  updateImageList() {
    this.#images = this.getImages();
  }
}

const PREFIX = "simpleTray.imageFeed.";
const ELIGIBLE_NODES = [
  "SaveImage",
  "PreviewImage",
  "KSampler",
  "KSampler (Efficient)",
  "KSampler Adv. (Efficient)",
  "KSampler SDXL (Eff.)",
];

const storage = {
  getVal: (key, defaultValue) => {
    const value = localStorage.getItem(PREFIX + key);
    return value === null ? defaultValue : value.replace(/^"|"$/g, "");
  },
  setVal: (key, value) => {
    localStorage.setItem(
      PREFIX + key,
      typeof value === "boolean" ? value.toString() : value
    );
  },
  getJSONVal: (key, defaultValue) => {
    try {
      const value = localStorage.getItem(PREFIX + key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error(`Error retrieving ${key} from localStorage`, error);
      return defaultValue;
    }
  },
  setJSONVal: (key, value) => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (error) {
      console.error("Error saving to localStorage", error);
    }
  },
};

const createElement = (type, options = {}) => {
  const element = document.createElement(type);
  Object.entries(options).forEach(([key, value]) => {
    if (key === "style") {
      Object.assign(element.style, value);
    } else if (key === "classList") {
      element.classList.add(...value);
    } else {
      element[key] = value;
    }
  });
  return element;
};

const debounce = (func, wait) => {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

class ImageFeed {
  constructor() {
    this.visible = storage.getJSONVal("Visible", true);
    this.imageFeed = null;
    this.imageList = null;
    this.buttonPanel = null;
    this.currentBatchIdentifier = null;
    this.currentBatchContainer = null;
    this.selectedNodeIds = storage.getJSONVal("NodeFilter", []);
    this.imageNodes = [];
    this.sortOrder = storage.getJSONVal("SortOrder", "ID");
    this.lightbox = new Lightbox(this.getAllImages.bind(this));
  }

  async setup() {
    this.createMainElements();
    this.createButtons();
    this.setupEventListeners();
    this.updateControlPositions(storage.getJSONVal("Location", "bottom"));
    this.adjustImageTray();
    this.waitForSideToolbar();
    this.setupSettings();

    // Initialize visibility
    this.changeFeedVisibility(this.visible);
  }

  createMainElements() {
    this.imageFeed = $el("div", {
      className: "tb-image-feed",
      parent: document.body,
    });
    this.imageList = $el("div", { className: "tb-image-feed-list" });
    this.buttonPanel = $el("div", { className: "tb-image-feed-btn-group" });
    this.imageFeed.append(this.imageList, this.buttonPanel);
  }

  createButtons() {
    const clearButton = this.createButton("Clear", () => this.clearImageFeed());
    const nodeFilterButton = this.createButton("Node Filter", () =>
      this.showNodeFilter()
    );
    this.buttonPanel.append(nodeFilterButton, clearButton);
  }

  createButton(text, onClick) {
    return $el("button.tb-image-feed-btn", {
      textContent: text,
      onclick: onClick,
    });
  }

  setupEventListeners() {
    api.addEventListener("execution_start", this.onExecutionStart.bind(this));
    api.addEventListener("executed", (event) => {
      console.log("Executed event fired:", event);
      this.onExecuted(event);
    });
    window.addEventListener(
      "resize",
      debounce(() => this.adjustImageTray(), 200)
    );
  }

  onExecutionStart({ detail }) {
    const filterEnabled = storage.getJSONVal("FilterEnabled", false);
    if (
      filterEnabled &&
      (!this.selectedNodeIds || this.selectedNodeIds.length === 0)
    ) {
      storage.setJSONVal("FilterEnabled", false);
    }
  }

  onExecuted({ detail }) {
    console.log("onExecuted called");
    console.log("this.visible:", this.visible);
    console.log("detail:", detail);
    console.log("detail?.output?.images:", detail?.output?.images);

    if (!this.visible || !detail?.output?.images) {
      console.log("Returning early from onExecuted");
      return;
    }

    console.log("Proceeding to handleExecuted");
    this.handleExecuted(detail);
  }

  handleExecuted(detail) {
    if (!this.visible || !detail?.output?.images) return;

    const newestToOldest = storage.getVal("NewestFirst", "newest") === "newest";
    const filterEnabled = storage.getJSONVal("FilterEnabled", false);
    const newBatchIdentifier = detail.prompt_id;

    if (detail.node?.includes?.(":")) {
      const n = app.graph.getNodeById(detail.node.split(":")[0]);
      if (n?.getInnerNodes) return;
    }

    const isNewBatch = newBatchIdentifier !== this.currentBatchIdentifier;

    if (isNewBatch) {
      // If we're starting a new batch, create it
      this.createNewBatch(newestToOldest, newBatchIdentifier);
    }

    this.addImagesToBatch(detail, filterEnabled, newestToOldest);

    this.checkAndRemoveExtraImageBatches();
    setTimeout(() => window.dispatchEvent(new Event("resize")), 1);
  }

  ensureBatchContainer(newestToOldest) {
    if (!this.currentBatchContainer) {
      this.currentBatchContainer = createElement("div", {
        className: "image-batch-container",
      });
    }
    if (newestToOldest) {
      this.imageList.prepend(this.currentBatchContainer);
    } else {
      this.imageList.appendChild(this.currentBatchContainer);
    }
  }

  createNewBatch(newestToOldest, newBatchIdentifier) {
    this.currentBatchContainer = createElement("div", {
      className: "image-batch-container",
    });

    const startBar = createElement("div", {
      className: "image-feed-vertical-bar",
    });
    this.currentBatchContainer.appendChild(startBar);

    const isFirstBatch = this.imageList.children.length === 0;
    if (isFirstBatch && newestToOldest) {
      const endBar = createElement("div", {
        className: "image-feed-vertical-bar",
      });
      this.currentBatchContainer.appendChild(endBar);
    }

    if (newestToOldest) {
      this.imageList.prepend(this.currentBatchContainer);
    } else {
      this.imageList.appendChild(this.currentBatchContainer);
    }

    this.currentBatchIdentifier = newBatchIdentifier;
  }

  addImagesToBatch(detail, filterEnabled, newestToOldest) {
    detail.output.images.forEach((src) => {
      const node = app.graph.getNodeById(parseInt(detail.node, 10));
      if (
        !filterEnabled ||
        (node?.type &&
          ELIGIBLE_NODES.includes(node.type) &&
          this.selectedNodeIds.includes(parseInt(detail.node, 10))) ||
        (!ELIGIBLE_NODES.includes(node.type) &&
          this.selectedNodeIds.includes(-1))
      ) {
        this.addImageToBatch(src, this.currentBatchContainer, newestToOldest);
      }
    });
  }

  async addImageToBatch(src, batchContainer, newestToOldest) {
    try {
      const baseUrl = `./view?filename=${encodeURIComponent(
        src.filename
      )}&type=${src.type}&subfolder=${encodeURIComponent(src.subfolder)}`;
      const timestampedUrl = `${baseUrl}&t=${+new Date()}`;
      const img = await this.loadImage(timestampedUrl);
      const imageElement = this.createImageElement(
        img,
        timestampedUrl,
        baseUrl
      );
      const bars = batchContainer.querySelectorAll(".image-feed-vertical-bar");

      if (bars.length === 2) {
        // This is the first batch with two bars
        if (newestToOldest) {
          bars[1].before(imageElement);
        } else {
          // For oldest-first, insert before the second bar
          bars[1].before(imageElement);
        }
      } else {
        // For subsequent batches, add after the single bar
        if (newestToOldest) {
          batchContainer.firstChild.after(imageElement);
        } else {
          batchContainer.appendChild(imageElement);
        }
      }
    } catch (error) {
      console.error("Error adding image to batch", error);
      const placeholderImg = createElement("img", {
        src: "path/to/placeholder.png",
        alt: "Image failed to load",
      });
      batchContainer.appendChild(placeholderImg);
    }
  }

  createImageElement(img, timestampedUrl, baseUrl) {
    const imageElement = createElement("div", { className: "image-container" });
    const anchor = createElement("a", {
      target: "_blank",
      href: timestampedUrl,
      onclick: (e) => this.handleImageClick(e, timestampedUrl, baseUrl),
    });
    anchor.appendChild(img);
    imageElement.appendChild(anchor);
    return imageElement;
  }

  handleImageClick(e, timestampedUrl, baseUrl) {
    e.preventDefault();
    const imgs = this.getAllImages();
    const normalizedUrls = imgs.map((url) => url.split("&t=")[0]);
    const baseUrlAbsolute = new URL(baseUrl, window.location.origin).href;
    const imageIndex = normalizedUrls.indexOf(baseUrlAbsolute);
    if (imageIndex > -1) {
      this.lightbox.show(imgs, imageIndex);
    } else {
      console.error(
        "Clicked image not found in the list:",
        new Error("Image not found")
      );
    }
  }

  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  getAllImages() {
    const images = document.querySelectorAll(".tb-image-feed img");
    return Array.from(images).map(
      (img) => new URL(img.src, window.location.origin).href
    );
  }

  checkAndRemoveExtraImageBatches() {
    const maxImageBatches = storage.getVal("MaxFeedLength", 25);
    const batches = Array.from(
      this.imageList.querySelectorAll(".image-batch-container")
    );

    if (batches.length <= maxImageBatches) return;

    batches.slice(maxImageBatches).forEach((batch) => {
      batch.remove();
    });
  }

  clearImageFeed() {
    this.currentBatchIdentifier = null;
    this.currentBatchContainer = null;
    this.imageList.replaceChildren();
    window.dispatchEvent(new Event("resize"));
  }

  async showNodeFilter() {
    const overlay = await this.loadModal();
    this.createImageNodeList();
    this.setNodeSelectorVisibility(true);
  }

  updateControlPositions(feedLocation) {
    if (!this.imageFeed) {
      console.error(
        "Image feed element not found",
        new Error("Element not found")
      );
      return;
    }

    this.imageFeed.classList.remove(
      "tb-image-feed--top",
      "tb-image-feed--bottom"
    );
    this.buttonPanel.classList.remove(
      "tb-image-feed-btn-group--top",
      "tb-image-feed-btn-group--bottom"
    );

    if (feedLocation === "top") {
      this.imageFeed.classList.add("tb-image-feed--top");
      this.buttonPanel.classList.add("tb-image-feed-btn-group--top");
    } else {
      this.imageFeed.classList.add("tb-image-feed--bottom");
      this.buttonPanel.classList.add("tb-image-feed-btn-group--bottom");
    }
  }

  adjustImageTray() {
    try {
      const sideToolBar = document.querySelector(
        ".comfyui-body-left .side-tool-bar-container"
      );
      const comfyuiMenu = document.querySelector("nav.comfyui-menu");

      const toolbarWidth = sideToolBar?.offsetWidth || 0;
      this.imageFeed.style.setProperty("--tb-left-offset", `${toolbarWidth}px`);
      this.imageFeed.style.width = `calc(100% - ${toolbarWidth}px)`;

      const feedHeight =
        parseInt(
          getComputedStyle(this.imageFeed).getPropertyValue("--tb-feed-height")
        ) || 300;
      this.imageFeed.style.height = `${feedHeight}px`;

      const feedLocation = storage.getJSONVal("Location", "bottom");
      const isFeedAtTop = feedLocation === "top";

      if (comfyuiMenu) {
        const menuHeight = comfyuiMenu.offsetHeight;
        const menuRect = comfyuiMenu.getBoundingClientRect();
        const isMenuAtTop = menuRect.top <= 1;
        const isMenuAtBottom =
          Math.abs(window.innerHeight - menuRect.bottom) <= 1;

        if (isFeedAtTop) {
          this.imageFeed.style.top = isMenuAtTop ? `${menuHeight}px` : "0";
          this.imageFeed.style.bottom = "auto";
        } else {
          this.imageFeed.style.bottom = isMenuAtBottom
            ? `${menuHeight}px`
            : "0";
          this.imageFeed.style.top = "auto";
        }
      } else {
        this.imageFeed.style.top = isFeedAtTop ? "0" : "auto";
        this.imageFeed.style.bottom = isFeedAtTop ? "auto" : "0";
      }

      if (sideToolBar && isFeedAtTop) {
        const sideToolBarRect = sideToolBar.getBoundingClientRect();
        if (sideToolBarRect.top <= 1) {
          const maxTop = Math.max(
            parseInt(this.imageFeed.style.top) || 0,
            sideToolBarRect.height
          );
          this.imageFeed.style.top = `${maxTop}px`;
        }
      }

      this.adjustButtonPanelPosition(isFeedAtTop);
    } catch (error) {
      console.error("Error adjusting image tray:", error);
    }
  }

  adjustButtonPanelPosition(isFeedAtTop) {
    if (isFeedAtTop) {
      const imageFeedTop = parseInt(this.imageFeed.style.top) || 0;
      this.buttonPanel.style.top = `${imageFeedTop + 10}px`;
      this.buttonPanel.style.bottom = "auto";
    } else {
      const imageFeedHeight =
        parseInt(
          getComputedStyle(this.imageFeed).getPropertyValue("--tb-feed-height")
        ) || 300;
      const imageFeedTop = window.innerHeight - imageFeedHeight;
      this.buttonPanel.style.top = `${imageFeedTop + 10}px`;
      this.buttonPanel.style.bottom = "auto";
    }
  }

  waitForSideToolbar() {
    const MAX_OBSERVATION_TIME = 10000;
    let timeoutId;
    const observer = new MutationObserver((mutationsList, observer) => {
      const sideToolBar = document.querySelector(
        ".comfyui-body-left .side-tool-bar-container"
      );
      if (sideToolBar) {
        this.adjustImageTray();
        observer.disconnect();
        clearTimeout(timeoutId);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    timeoutId = setTimeout(() => {
      observer.disconnect();
      console.error(
        "Sidebar not found within the maximum observation time",
        new Error("Timeout")
      );
    }, MAX_OBSERVATION_TIME);
  }

  async loadModal() {
    try {
      const overlay = await this.loadOverlay();
      let modal = document.getElementById("nodeSelectorPlaceholder");

      if (!modal) {
        modal = createElement("div", {
          id: "nodeSelectorPlaceholder",
          className: "nodeSelectorPlaceholder",
        });
        overlay.appendChild(modal);
      }

      return modal;
    } catch (error) {
      console.error("Error loading modal:", error);
    }
  }

  loadOverlay() {
    return new Promise((resolve, reject) => {
      let overlay = document.getElementById("modalOverlay");

      if (!overlay) {
        overlay = createElement("div", {
          id: "modalOverlay",
          className: "modalOverlay",
        });
        document.body.appendChild(overlay);

        overlay.addEventListener("click", (event) => {
          if (event.target === overlay) {
            this.setNodeSelectorVisibility(false);
          }
        });
      }

      resolve(overlay);
    });
  }

  async createImageNodeList() {
    const nodeListElement = await this.loadModal();

    if (!nodeListElement) {
      console.error("Modal element not found");
      return;
    }

    const header = createElement("h2", {
      textContent: "Detected Image Nodes",
      style: {
        textAlign: "center",
        color: "#FFF",
        margin: "0 0 20px",
        fontSize: "24px",
      },
    });

    nodeListElement.innerHTML = "";
    nodeListElement.appendChild(header);

    const buttonContainer = createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        width: "100%",
        marginBottom: "5px",
      },
    });

    const filterEnabled = storage.getJSONVal("FilterEnabled", false);

    const filterToggleButton = createElement("button", {
      className: "tb-image-feed-btn",
      textContent: filterEnabled ? "Disable Filter" : "Enable Filter",
      onclick: () => this.toggleFilter(filterToggleButton, sortToggleButton),
    });

    const sortToggleButton = createElement("button", {
      className: "tb-image-feed-btn",
      textContent:
        storage.getJSONVal("SortOrder", "ID") === "ID"
          ? "Sort by Name"
          : "Sort by ID",
      onclick: () => this.toggleSortOrder(sortToggleButton),
      disabled: !filterEnabled,
    });

    buttonContainer.appendChild(filterToggleButton);
    buttonContainer.appendChild(sortToggleButton);
    nodeListElement.appendChild(buttonContainer);

    await this.redrawImageNodeList();
  }

  updateCheckboxStates(enabled) {
    const checkboxes = document.querySelectorAll(
      '.node-list-item input[type="checkbox"], #custom-node-checkbox'
    );
    checkboxes.forEach((checkbox) => {
      checkbox.disabled = !enabled;
    });
  }

  async toggleFilter(filterToggleButton, sortToggleButton) {
    const filterEnabled = storage.getJSONVal("FilterEnabled", false);
    const newFilterState = !filterEnabled;

    storage.setJSONVal("FilterEnabled", newFilterState);

    filterToggleButton.textContent = newFilterState
      ? "Disable Filter"
      : "Enable Filter";
    sortToggleButton.disabled = !newFilterState;

    // Clear selected nodes when disabling filter
    if (!newFilterState) {
      this.selectedNodeIds = [];
      storage.setJSONVal("NodeFilter", this.selectedNodeIds);
    }

    // Update checkbox states
    this.updateCheckboxStates(newFilterState);

    await this.redrawImageNodeList();
  }

  async toggleSortOrder(sortToggleButton) {
    const currentSortOrder = storage.getJSONVal("SortOrder", "ID");
    const newSortOrder = currentSortOrder === "ID" ? "Name" : "ID";

    storage.setJSONVal("SortOrder", newSortOrder);

    sortToggleButton.textContent =
      newSortOrder === "ID" ? "Sort by Name" : "Sort by ID";

    await this.redrawImageNodeList();
  }

  updateImageNodes() {
    const nodes = Object.values(app.graph._nodes);
    this.imageNodes = nodes.filter((node) =>
      ELIGIBLE_NODES.includes(node.type)
    );
  }

  sortImageNodes() {
    const sortOrder = storage.getJSONVal("SortOrder", "ID");
    this.imageNodes.sort((a, b) => {
      if (sortOrder === "Name") {
        return a.title.localeCompare(b.title) || a.id - b.id;
      }
      return a.id - b.id;
    });
  }

  async redrawImageNodeList() {
    const listContainer = await this.loadModal();

    let nodeList = listContainer.querySelector(".node-list");
    if (!nodeList) {
      nodeList = createElement("ul", { className: "node-list" });
      listContainer.appendChild(nodeList);
    }

    const fragment = document.createDocumentFragment();
    const filterEnabled = storage.getJSONVal("FilterEnabled", false);

    this.updateImageNodes();
    this.sortImageNodes();

    this.imageNodes.forEach((node, index) => {
      const listItem = createElement("li", {
        className: `node-list-item ${index % 2 === 0 ? "even" : "odd"}`,
      });

      const checkbox = createElement("input", {
        type: "checkbox",
        id: `node-${node.id}`,
        checked: this.selectedNodeIds.includes(node.id),
        disabled: !filterEnabled,
      });

      checkbox.addEventListener("change", () => {
        this.updateSelectedNodeIds(node.id, checkbox.checked);
      });

      const label = createElement("label", {
        htmlFor: checkbox.id,
        textContent: node.title
          ? `${node.title} (ID: ${node.id})`
          : `Node ID: ${node.id}`,
      });

      listItem.appendChild(checkbox);
      listItem.appendChild(label);

      fragment.appendChild(listItem);
    });

    nodeList.replaceChildren(fragment);

    let customNodeItem = listContainer.querySelector(".custom-node-item");
    if (!customNodeItem) {
      customNodeItem = createElement("li", { className: "custom-node-item" });

      const customCheckbox = createElement("input", {
        type: "checkbox",
        id: "custom-node-checkbox",
        checked: this.selectedNodeIds.includes(-1),
        disabled: !filterEnabled,
      });

      customCheckbox.addEventListener("change", (e) => {
        this.updateSelectedNodeIds(-1, e.target.checked);
      });

      const customLabel = createElement("label", {
        htmlFor: "custom-node-checkbox",
        textContent: "Custom Nodes Not Shown",
        className: "custom-label",
      });

      customNodeItem.appendChild(customCheckbox);
      customNodeItem.appendChild(customLabel);

      nodeList.appendChild(customNodeItem);
    } else {
      const customCheckbox = customNodeItem.querySelector(
        'input[type="checkbox"]'
      );
      if (customCheckbox) {
        customCheckbox.checked = this.selectedNodeIds.includes(-1);
        customCheckbox.disabled = !filterEnabled;
      }
    }

    // Update all checkbox states
    this.updateCheckboxStates(filterEnabled);
  }

  updateSelectedNodeIds(nodeId, isChecked) {
    if (isChecked) {
      if (!this.selectedNodeIds.includes(nodeId)) {
        this.selectedNodeIds.push(nodeId);
      }
    } else {
      this.selectedNodeIds = this.selectedNodeIds.filter((id) => id !== nodeId);
    }

    storage.setJSONVal("NodeFilter", this.selectedNodeIds);
  }

  setNodeSelectorVisibility(isVisible) {
    const overlay = document.getElementById("modalOverlay");
    const modal = document.getElementById("nodeSelectorPlaceholder");

    if (!overlay || !modal) {
      console.error("Overlay or modal not found");
      return;
    }

    overlay.style.display = isVisible ? "flex" : "none";
    modal.style.display = isVisible ? "block" : "none";
  }

  setupSettings() {
    app.ui.settings.addSetting({
      id: "simpleTray.imageFeed.feedHeight",
      name: "📥 Image Tray Height",
      defaultValue: 200,
      type: "combo",
      options: [
        { text: "100px", value: 100 },
        { text: "150px", value: 150 },
        { text: "200px", value: 200 },
        { text: "250px", value: 250 },
        { text: "300px", value: 300 },
        { text: "350px", value: 350 },
        { text: "400px", value: 400 },
      ],
      onChange: (newValue) => {
        const newHeight = `${newValue}px`;
        this.imageFeed.style.setProperty("--tb-feed-height", newHeight);
        window.dispatchEvent(new Event("resize"));
      },
      tooltip: "Select the height of the image feed tray.",
    });

    app.ui.settings.addSetting({
      id: "simpleTray.imageFeed.NewestFirst",
      name: "📥 Image Tray Sort Order",
      defaultValue: "newest",
      type: "combo",
      options: [
        { text: "newest first", value: "newest" },
        { text: "oldest first", value: "oldest" },
      ],
      onChange: (newValue) => {
        storage.setVal("NewestFirst", newValue);
        this.adjustImageTray();
      },
      tooltip: "Choose the sort order of images in the feed.",
    });

    app.ui.settings.addSetting({
      id: "simpleTray.imageFeed.MaxFeedLength",
      name: "📥 Max Batches In Feed",
      defaultValue: 25,
      type: "number",
      onChange: (newValue) => {
        storage.setVal("MaxFeedLength", newValue);
        this.checkAndRemoveExtraImageBatches();
      },
      tooltip:
        "Maximum number of image batches to retain before the oldest start dropping from image feed.",
      attrs: {
        min: "25",
        max: "200",
        step: "25",
      },
    });

    app.ui.settings.addSetting({
      id: "simpleTray.imageFeed.Location",
      name: "📥 Image Tray Location",
      defaultValue: storage.getJSONVal("Location", "bottom"),
      type: "combo",
      options: [
        { text: "top", value: "top" },
        { text: "bottom", value: "bottom" },
      ],
      onChange: (newLocation) => {
        this.updateControlPositions(newLocation);
        storage.setJSONVal("Location", newLocation);
        this.adjustImageTray();
      },
      tooltip: "Choose the location of the image feed.",
    });

    app.ui.settings.addSetting({
      id: "simpleTray.imageFeed.TrayVisible",
      name: "📥 Display Image Tray",
      type: "boolean",
      defaultValue: storage.getJSONVal("Visible", true),
      onChange: (value) => {
        this.visible = value;
        storage.setJSONVal("Visible", value);
        this.changeFeedVisibility(value);
      },
      tooltip: "Change the visibility of the Image Feed.",
    });
  }

  changeFeedVisibility(isVisible) {
    this.imageFeed.style.display = isVisible ? "flex" : "none";
    if (isVisible) this.adjustImageTray();
    window.dispatchEvent(new Event("resize"));
  }
}

app.registerExtension({
  name: "simpleTray.imageFeed",
  async setup() {
    const imageFeed = new ImageFeed();
    await imageFeed.setup();
  },
});

// CSS Styles
const styles = `
  :root {
    --tb-background-color-main: rgb(36, 39, 48);
    --tb-separator-color: yellow;
    --tb-border-color: #ccc;
    --tb-text-color: #333;
    --tb-highlight-filter: brightness(1.2);
    --tb-feed-height: 300px;
    --tb-left-offset: 0px;
  }

  .tb-image-feed {
    position: fixed;
    display: flex;
    background-color: rgba(36, 39, 48, 0.8);
    z-index: 500;
    transition: all 0.3s ease;
    border: 1px solid var(--tb-border-color);
    height: var(--tb-feed-height);
    width: calc(100% - var(--tb-left-offset));
    left: var(--tb-left-offset);
  }

  .tb-image-feed--bottom { bottom: 0; top: auto; }
  .tb-image-feed--top { top: 0; bottom: auto; }

  .tb-image-feed-list {
    display: flex;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: auto;
    height: 100%;
    width: 100%;
  }

  .image-batch-container {
    display: flex;
    align-items: center;
    height: 100%;
    overflow: hidden;
    white-space: nowrap;
  }

  .image-container {
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    height: 100%;
    width: auto;
  }

  .image-container a {
    display: flex;
    height: 100%;
  }

  .image-container img {
    height: 100%;
    width: auto;
    object-fit: contain;
  }

  .image-feed-vertical-bar {
    height: 99.5%;
    width: 4px;
    background-color: var(--tb-separator-color);
  }

  .tb-image-feed-btn-group {
    position: fixed;
    display: flex;
    gap: 5px;
    z-index: 502;
  }

  .tb-image-feed-btn-group--top {
    top: calc(var(--tb-feed-height) + 20px);
    right: 10px;
  }

  .tb-image-feed-btn-group--bottom {
    top: calc(100vh - var(--tb-feed-height) - 40px);
    right: 10px;
  }

  .tb-image-feed-btn {
    padding: 8px 16px;
    font-size: 15px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    height: auto;
    width: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #ffffff;
    color: #333;
    border: none;
    border-radius: 8px;
    box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.15);
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .tb-image-feed-btn:hover {
    background-color: #f0f0f0;
    transform: translateY(-2px);
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
  }

  .tb-image-feed-btn:active {
    transform: translateY(0);
    box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.15);
  }

  .tb-image-feed-btn:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(100, 150, 255, 0.5);
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
    border: 1px solid var(--tb-border-color);
    border-radius: 5px;
    color: var(--tb-text-color);
    cursor: pointer;
    z-index: 600;
  }

  .tb-close-btn:hover {
    filter: var(--tb-highlight-filter);
  }

  .tb-close-btn:active {
    transform: translateY(1px);
  }

  .modalOverlay {
    position: fixed;
    inset: 0;
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
    border: 2px solid var(--tb-separator-color);
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

  .node-list-item:nth-child(even) {
    background-color: #000;
  }

  .custom-node-item {
    display: flex;
    align-items: center;
    margin: 20px 0 10px;
    padding: 10px;
    border-radius: 5px;
    background-color: #000;
    border: 1px solid var(--tb-separator-color);
  }

  .custom-label {
    color: #FFF;
  }

  .custom-label.disabled {
    color: #555;
  }
`;

const lightboxStyles = `
.lightbox {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: none;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
  z-index: 1000;
}

.lightbox__main {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 90%;
  max-height: 90%;
}

.lightbox__img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: opacity 0.2s ease-in-out;
}

/* Arrow buttons with increased size */
.lightbox__close,
.lightbox__prev,
.lightbox__next {
  position: absolute;
  width: 120px; /* 300% bigger */
  height: 120px; /* 300% bigger */
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}

/* Hover effect for close, prev, next buttons */
.lightbox__close:hover,
.lightbox__prev:hover,
.lightbox__next:hover {
  background-color: rgba(0, 0, 0, 0.8);
}

/* Close button styles */
.lightbox__close {
  top: 20px;
  right: 20px;
}

.lightbox__close::before,
.lightbox__close::after {
  content: "";
  position: absolute;
  width: 60px; /* 300% bigger */
  height: 6px; /* 300% bigger */
  background-color: white;
}

.lightbox__close::before {
  transform: rotate(45deg);
}

.lightbox__close::after {
  transform: rotate(-45deg);
}

/* Positioning prev and next arrows */
.lightbox__prev,
.lightbox__next {
  top: 50%;
  transform: translateY(-50%);
}

/* Previous arrow */
.lightbox__prev {
  left: 40px; /* Adjusted to keep a good visual distance */
}

.lightbox__prev::before,
.lightbox__next::before {
  content: "";
  display: block;
  width: 30px; /* 300% bigger */
  height: 30px; /* 300% bigger */
  border-top: 6px solid white; /* 300% bigger */
  border-left: 6px solid white; /* 300% bigger */
}

/* Arrow rotation for prev */
.lightbox__prev::before {
  transform: rotate(-45deg);
}

/* Next arrow */
.lightbox__next {
  right: 40px; /* Adjusted to keep a good visual distance */
}

/* Arrow rotation for next */
.lightbox__next::before {
  transform: rotate(135deg);
}

/* Wrapping state for previous arrow */
.lightbox__prev--wrap {
  background-color: rgba(255, 165, 0, 0.8); /* Orange color for wrapping state */
}

/* Wrapping state for next arrow */
.lightbox__next--wrap {
  background-color: rgba(255, 165, 0, 0.8); /* Same orange color for wrapping state */
}

/* Hover effect for wrapping state */
.lightbox__prev--wrap:hover,
.lightbox__next--wrap:hover {
  background-color: rgba(255, 140, 0, 1); /* Darker orange on hover */
}

/* Spinner for image loading */
.lightbox__spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
  display: none;
}

/* Keyframes for spinner */
@keyframes spin {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  100% {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}
`;

const styleElement = document.createElement("style");
styleElement.textContent = lightboxStyles;
document.head.appendChild(styleElement);

// Append the styles to the document
$el("style", {
  textContent: styles,
  parent: document.head,
});

export const BLADE_CAVITIES = [
  "Leading Edge",
  "Trailing Edge",
  "Center Web",
  "Third Web",
  "C Stiffener",
];

export const DEFECT_DISPOSITION_OPTIONS = [
  //"AI False Positive",
  "Out of Tolerance - Repair Needed",
  "Within Tolerance - No Repair Needed",
  "False Positive",
  "Duplicate",
  "Evidence"
];

export const BLADE_TYPE_OPTIONS = [
  "122",
  "107",
  "80.4",
  "77.4P3",
  "77.4P6",
  "75.7P2",
  "68.7",
  "64.6",
  "62.2",
  "56.9",
  "50.2",
  "48.7",
  "47.3",
  "44.1",
];

export const MANUFACTURE_STAGE_OPTIONS = [
  "Final_Release_Inspection",
  "In_Mold_PreClosing_Inspection",
  "Post_Mold_Inspection",
  "Post_Mold_RCO_Inspection",
  "Other_Inspection",

  // "Post Molding",
  // "Post Molding_RCO",
  // "Final Release",
  // "Post Shipping",
  // "Uptower",
  // "Other",
];

export const SUPPLIER_OPTIONS = ["TPI", "LM", "BAO"];

export const FACTORY_NAME_OPTIONS = [
  "BAO",
  "CAS",
  "CHE",
  "DAB",
  "FUJ",
  "GAS",
  "GRF",
  "MX3",
  "MX2",
  "MX1",
  "VAD",
  "Other",
];

export const INSPECTION_LOCATION_OPTIONS = [
  "Baodi",
  "Borderlands",
  "Castellon",
  "Cherbourg",
  "Dabaspet",
  "Fujian",
  "Gaspe",
  "Grand Forks",
  "Juarez",
  "Lubbock",
  "Ponferrada",
  "St Teresa Laydown",
  "Vadodara",
  "Other",
];

export const defectColors2 = [
  "#696969",
  "#8b4513",
  "#228b22",
  "#808000",
  "#483d8b",
  "#008b8b",
  "#9acd32",
  "#00008b",
  "#8fbc8f",
  "#8b008b",
  "#b03060",
  "#ff0000",
  "#ffa500",
  "#ffff00",
  "#7cfc00",
  "#deb887",
  "#8a2be2",
  "#dc143c",
  "#00ffff",
  "#00bfff",
  "#0000ff",
  "#ff00ff",
  "#1e90ff",
  "#fa8072",
  "#add8e6",
  "#ff1493",
  "#ee82ee",
  "#98fb98",
];

export const defectColors3 = [
  "#ff0000", // Red (Hot)
  "#ff1500",
  "#ff2a00",
  "#ff4000",
  "#ff5500",
  "#ff6a00",
  "#ff8000",
  "#ff9500",
  "#ffaa00",
  "#ffbf00",
  "#ffd500", // Yellow-Orange
  "#ffea00",
  "#ffff00", // Yellow
  "#d4ff00",
  "#aaff00",
  "#80ff00",
  "#55ff00",
  "#2aff00",
  "#00ff00", // Green
  "#00ff55",
  "#00ffaa",
  "#00ffff", // Cyan
  "#00aaff",
  "#0055ff",
  "#0000ff", // Blue
  "#0000ea",
  "#0000d5",
  "#0000bf",
  "#0000aa", // Dark Blue (Cold)
];

export const defectColors = [
  "#FFFFFF",
  "#DDDDDD",
  "#FFFFFF",
  "#DDDDDD",
  "#FFFFFF",
  "#DDDDDD",
  "#FFFFFF",
  "#DDDDDD",
  "#FFFFFF",
  "#DDDDDD",
  "#FFFFFF",
  "#DDDDDD",
  "#FFFFFF",
  "#DDDDDD",
  "#FFFFFF",
  "#DDDDDD",
  "#FFFFFF",
  "#DDDDDD",
  "#FFFFFF",
  "#DDDDDD",
  "#FFFFFF",
  "#DDDDDD",
  "#FFFFFF",
  "#DDDDDD",
];

export const defectSubmenuColors = [
  "#ACD2D2", //  cake green
  "#E4F1F1", //  cake green
  "#ACD2D2", //  cake green
  "#E4F1F1", //  cake green
  "#ACD2D2", //  cake green
  "#E4F1F1", //  cake green
  "#ACD2D2", //  cake green
  "#E4F1F1", //  cake green
  "#ACD2D2", //  cake green
  "#E4F1F1", //  cake green
];

export const defectSubmenuColors1 = [
  "#006B3C", // Darker green (representing a rich evergreen)
  "#009645", // Medium green (vibrant, like a new leaf)
  "#007A3D", // Slightly darker green
  "#00A651", // Lighter green with more vibrance
  "#006B3C", // Repeat the alternating pattern
  "#009645",
  "#007A3D",
  "#00A651",
  "#006B3C",
  "#009645",
];

// this is the official list of defects for the UI.
export const defectLabels = [
  "Adhesive Cracks",
  "Adhesive Voids",
  "CoreGap",
  "Cuts in Web Flange",
  "Damaged Glass",
  "Dust & dirt",
  "Entrained air",
  "Exposed core / Missing laminate",
  "Foreign Objects",
  "Laminate Loose Edge",
  "Layer end",
  "Layer misplacement",
  "Layers Overlap",
  "LPS Cable Damage",
  "Main SW Web Foot Lam",
  "Metal Shavings",
  "RCO Bracket bond",
  "RCO Seal",
  "Repairs incorrect staggering",
  "Shearclips missing",
  "TE SW Web Foot Lam",
  "TEBC Overlam Overlap",
  "TEBC Paste Thickness",
  "TEBC Wave",
  "Uncured laminate",
  "Other",
  "Voids Overlaminate",
  "Waves Laminate",
  "Core Offset",
  // added
  "Semi-Dry Glass / LFR",
  "Delamination / LDL",
  "Core Misplacement / LCM",
  "LPS Loose Cable",
  "Laminate Roving Misplacement / LRM",
  // "Excess Adhesive", // removed.
];

export const defectForeignObjectSubCat = [
  "Foreign Objects /Adhered - Release film on surface",
  "Foreign Objects /Adhered - Tacky tape on surface",
  "Foreign Objects /Adhered - Green mesh, netting",
  "Foreign Objects /Loose - Sandpaper Loose",
  "Foreign Objects /Embedded - Object in bond line",
  "Foreign Objects /Embedded - Vacuum Hose in bond line",
  "Foreign Objects /Adhered - Masking tape on surface",
  "Foreign Objects /Adhered - Resin Syringe, loose",
  "Foreign Objects /Loose - Web separators (plastic tubes)",
  "Foreign Objects /adhered - Wood block, attached",
  "Foreign Objects /Loose - Wood block, loose",
  "Foreign Objects /Adhered - Web Catchers",
];

export const editMenu = ["Exit", "Edit", "Erase"];

export const editMenuColors = ["#555555", "#111111", "#555555"];

export const versionMajor = ["1"];
export const versionMinor = ["12"];

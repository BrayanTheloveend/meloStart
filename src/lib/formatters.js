/**
 * Utilitaires de formatage pour les métriques, nombres et devises du Dashboard Admin et du Studio.
 */

/**
 * Formate un nombre sous forme compacte pour les métriques de dashboard (ex: 1k, 14.3k, 1.2M, 2B).
 *
 * @param {number|string} value - Le nombre à formater.
 * @param {Object} [options] - Options de formatage.
 * @param {number} [options.decimals=1] - Nombre maximal de décimales (défaut: 1).
 * @param {boolean} [options.uppercaseK=false] - Si true, utilise 'K' au lieu de 'k'.
 * @param {string} [options.fallback="0"] - Valeur de repli si la valeur est nulle ou invalide.
 * @param {boolean} [options.space=false] - Si true, ajoute un espace avant l'unité (ex: "1.4 k").
 * @returns {string} Nombre formaté.
 *
 * @example
 * formatMetric(950)         // "950"
 * formatMetric(1428)        // "1.4k"
 * formatMetric(10000)       // "10k"
 * formatMetric(2485000)     // "2.5M"
 * formatMetric(1000000000)  // "1B"
 * formatMetric(1428, { uppercaseK: true }) // "1.4K"
 */
export function formatMetric(value, options = {}) {
  const {
    decimals = 1,
    uppercaseK = false,
    fallback = "0",
    space = false,
  } = options;

  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  // Gestion des chaînes : nettoyage des espaces et conversion des virgules
  const cleanedStr =
    typeof value === "string"
      ? value.trim().replace(/\s/g, "").replace(/,/g, ".")
      : value;
  const num = typeof cleanedStr === "number" ? cleanedStr : Number(cleanedStr);

  if (isNaN(num)) {
    return typeof value === "string" ? value : fallback;
  }

  const absNum = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  const sep = space ? " " : "";
  const kUnit = uppercaseK ? "K" : "k";

  // En dessous de 1 000, affichage direct sans suffixe
  if (absNum < 1000) {
    return `${sign}${Number.isInteger(num) ? absNum : Number(absNum.toFixed(decimals))}`;
  }

  const thresholds = [
    { value: 1e9, unit: "B" },
    { value: 1e6, unit: "M" },
    { value: 1e3, unit: kUnit },
  ];

  for (const { value: threshold, unit } of thresholds) {
    if (absNum >= threshold) {
      const quotient = absNum / threshold;
      let str = quotient.toFixed(decimals);
      // Supprimer les zéros superflus à la fin de la décimale (ex: 1.0k -> 1k, mais 1.2k reste 1.2k)
      str = str.replace(/\.0+$/, "").replace(/(\.[0-9]*[1-9])0+$/, "$1");
      return `${sign}${str}${sep}${unit}`;
    }
  }

  return `${sign}${absNum}`;
}

/**
 * Alias de formatMetric.
 */
export const formatCompactNumber = formatMetric;

/**
 * Formate une devise de manière compacte (ex: 2 485 000 -> "2.5M XAF").
 *
 * @param {number|string} amount - Montant à formater.
 * @param {string} [currency="XAF"] - Symbole ou code devise.
 * @param {Object} [options] - Options passées à formatMetric.
 * @returns {string}
 */
export function formatCompactCurrency(amount, currency = "XAF", options = {}) {
  const formatted = formatMetric(amount, options);
  return `${formatted} ${currency}`.trim();
}

/**
 * Formate un nombre complet avec les séparateurs de milliers (ex: 1428 -> "1 428").
 *
 * @param {number|string} value - Valeur numérique.
 * @param {string} [locale="fr-FR"] - Locale.
 * @returns {string}
 */
export function formatNumber(value, locale = "fr-FR") {
  if (value === null || value === undefined || value === "") return "0";
  const num =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/\s/g, "").replace(/,/g, "."));
  if (isNaN(num)) return "0";
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Formate un montant complet avec devise (ex: 2485000 -> "2 485 000 XAF").
 *
 * @param {number|string} amount - Montant à formater.
 * @param {string} [currency="XAF"] - Code ou symbole de la devise.
 * @param {string} [locale="fr-FR"] - Locale.
 * @returns {string}
 */
export function formatCurrency(amount, currency = "XAF", locale = "fr-FR") {
  if (amount === null || amount === undefined || amount === "") return `0 ${currency}`;
  const num =
    typeof amount === "number"
      ? amount
      : Number(String(amount).replace(/[^0-9.-]/g, ""));
  if (isNaN(num)) return typeof amount === "string" ? amount : `0 ${currency}`;
  return `${new Intl.NumberFormat(locale).format(Math.round(num))} ${currency}`.trim();
}

/**
 * Formate un pourcentage avec signe optionnel (ex: 18.4 -> "+18.4%").
 *
 * @param {number} value - Valeur en % ou ratio.
 * @param {Object} [options]
 * @param {boolean} [options.isRatio=false] - True si 0.18 représente 18%.
 * @param {boolean} [options.withSign=true] - Ajoute '+' pour les valeurs positives.
 * @param {number} [options.decimals=1]
 * @returns {string}
 */
export function formatPercentage(value, options = {}) {
  const { isRatio = false, withSign = true, decimals = 1 } = options;
  if (value === null || value === undefined || isNaN(value)) return "0%";
  const num = isRatio ? value * 100 : value;
  const sign = withSign && num > 0 ? "+" : "";
  return `${sign}${num.toFixed(decimals).replace(/\.0+$/, "")}%`;
}

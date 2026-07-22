/**
 * Advanced offensive-technique catalog for REPI.
 * Catalog data lives under ./techniques/*; this module re-exports lookup/format/route helpers.
 */

export { ADVANCED_TECHNIQUES } from "./techniques/catalog.ts";
export { formatTechniqueIndex, formatTechniquePlaybook } from "./techniques/format.ts";
export {
	domainLabel,
	resolveTechniqueDomain,
	techniqueById,
	techniqueDomains,
	techniquesForDomain,
} from "./techniques/lookup.ts";
export {
	TAXONOMY_SIZES,
	techniqueIdsForRoute,
	unresolvedCatalogTaxonomyIds,
} from "./techniques/route-taxonomy.ts";
export type { TechniqueDomain, TechniqueEntry } from "./techniques/types.ts";

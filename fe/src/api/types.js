// api/types.js

/**
 * @typedef {Object} RouteMetadata
 * @property {string} name
 * @property {string} path
 * @property {string[]} methods
 * @property {{name: string, converter: string}[]} path_params
 * @property {string} view_class
 * @property {string} app_name
 * @property {string} namespace
 * @property {boolean} executable
 * @property {string} [reason_unexecutable]
 * @property {string} [target_model]
 * @property {string} view_type
 */

/**
 * @typedef {Object} DashboardResponse
 * @property {RouteMetadata[]} routes
 * @property {number} count
 */

/**
 * @typedef {Object} ProfileRequest
 * @property {string} route
 * @property {string} [method='GET']
 * @property {number} [seed_count=0]
 * @property {Object} [path_params={}]
 * @property {Object} [query_params={}]
 * @property {string} [target_model]
 * @property {Object} [relationships]
 */

/**
 * @typedef {Object} SqlQuery
 * @property {string} sql
 * @property {number} duration_ms
 * @property {any[]} params
 * @property {string} alias
 * @property {boolean} is_select
 * @property {boolean} is_explain
 */

/**
 * @typedef {Object} N1Analysis
 * @property {string} fingerprint
 * @property {number} count
 * @property {string} [source_location]
 * @property {string} suggestion
 * @property {string[]} [sample_queries]
 */

/**
 * @typedef {Object} ExecutionResult
 * @property {SqlQuery[]} sql_queries
 * @property {number} total_queries
 * @property {number} total_duration_ms
 * @property {any[]} duplicate_queries
 * @property {any[]} n_plus_one_queries
 * @property {any[]} missing_indexes
 * @property {number} model_loads
 * @property {number} cache_hits
 * @property {number} cache_misses
 * @property {Object} metrics
 * @property {N1Analysis[]} analysis
 * @property {string[]} side_effect_warnings
 * @property {number} status_code
 * @property {any} response_body
 * @property {string} [error]
 */

/**
 * @typedef {Object} HealthResponse
 * @property {'ok'} status
 * @property {boolean} debug
 * @property {boolean} shadow_db_configured
 * @property {boolean} router_configured
 * @property {string} shadow_db_alias
 */
import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/client-UxEtH3WB.js
function createSupabaseClient() {
	return createClient("https://sbclwvukhlxxawkqaqyz.supabase.co", "sb_publishable_ljKeG0-Hw7VrQvO1Mfu0Fg_abJqqhN9", { auth: {
		storage: typeof window !== "undefined" ? localStorage : void 0,
		persistSession: true,
		autoRefreshToken: true
	} });
}
var _supabase;
var supabase = new Proxy({}, { get(_, prop, receiver) {
	if (!_supabase) _supabase = createSupabaseClient();
	return Reflect.get(_supabase, prop, receiver);
} });
//#endregion
export { supabase as t };

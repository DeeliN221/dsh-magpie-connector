window.__ModuleLoader__.load({
	id: "dsh-magpie-connector",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_dom = require("react-dom");
		// src/client/api.ts
		const TIMEOUT_MS = 3e4;
		/**
		* Spending a reset outlives the generic budget: the host waits up to 45s for the
		* gateway, which itself may spend 20s and then re-read the account for 15s. The
		* browser must not give up first — a timeout here reads as "outcome unknown".
		*/
		const RESET_TIMEOUT_MS = 6e4;
		function createFetchApi(base = "/api/dsh-magpie-connector/") {
			return async ({ method, path, query, body }) => {
				const search = query ? `?${new URLSearchParams(query).toString()}` : "";
				const controller = new AbortController();
				const timer = setTimeout(() => controller.abort(), path === "reset" ? RESET_TIMEOUT_MS : TIMEOUT_MS);
				try {
					const response = await fetch(`${base}${path}${search}`, {
						method,
						cache: "no-store",
						signal: controller.signal,
						headers: {
							accept: "application/json",
							...body === void 0 ? {} : { "content-type": "application/json" }
						},
						...body === void 0 ? {} : { body: JSON.stringify(body) }
					});
					let parsed = null;
					try {
						parsed = await response.json();
					} catch {
						parsed = null;
					}
					return {
						status: response.status,
						body: parsed
					};
				} finally {
					clearTimeout(timer);
				}
			};
		}
		const isOk = (response) => response.status >= 200 && response.status < 300;
		/** Error text of a failed response: the host's (already redacted) reason plus the status. */
		function failureText(response) {
			const reason = response.body?.error;
			return typeof reason === "string" && reason ? `HTTP ${response.status}：${reason}` : `HTTP ${response.status}`;
		}
		const errorText = (error) => error instanceof Error ? error.message : String(error);
		// src/client/latency.ts
		/** 4 bars at ≤100/250/450/600ms; a null reading (no connect within 600ms) is level 0. */
		const latencyLevel = (ms) => ms <= 100 ? 4 : ms <= 250 ? 3 : ms <= 450 ? 2 : ms <= 600 ? 1 : 0;
		/** Parse the host's `{lines: [{id, ms}]}` payload; malformed input reads as a failure. */
		function parseLatency(body) {
			if (!body || typeof body !== "object" || Array.isArray(body)) return void 0;
			const lines = body.lines;
			if (!Array.isArray(lines)) return void 0;
			const readings = /* @__PURE__ */ new Map();
			for (const entry of lines) {
				if (!entry || typeof entry !== "object" || Array.isArray(entry)) return void 0;
				const { id, ms } = entry;
				if (typeof id !== "string") return void 0;
				if (ms !== null && (typeof ms !== "number" || !Number.isFinite(ms))) return void 0;
				readings.set(id, ms);
			}
			return readings;
		}
		const parseable = (baseUrl) => {
			try {
				return !!new URL(baseUrl).hostname;
			} catch {
				return false;
			}
		};
		/**
		* A row only ever gets a reading when it is saved (has an id) and its address is
		* parseable; unsaved drafts and empty addresses stay idle in every phase.
		*/
		function lineLatency(state, line) {
			if (!(!!line.id && parseable(line.baseUrl))) return { state: "idle" };
			if (state.phase === "failed") return { state: "failed" };
			if (state.phase !== "done") return { state: "measuring" };
			if (state.measuring?.has(line.id)) return { state: "measuring" };
			if (!state.readings.has(line.id)) return { state: "idle" };
			const ms = state.readings.get(line.id) ?? null;
			return ms === null ? {
				state: "done",
				ms: null,
				level: 0
			} : {
				state: "done",
				ms,
				level: latencyLevel(ms)
			};
		}
		// src/client/bird-svg.ts
		const birdSvg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 44 44\" fill=\"#000\"><path fill-rule=\"evenodd\" d=\"M1.5 5.5C1.3 5.7 1.2 6.5 1.2 6.9C1.2 6.9 1.2 7 1.2 7.1C1.1 7.4 1.3 8 1.4 8.3C1.4 8.4 1.5 8.5 1.5 8.7C1.5 8.9 1.7 9 1.8 9.3C2.2 9.9 2.2 10 2.3 10.1C2.4 10.2 2.5 10.3 2.6 10.5C2.8 10.8 3 11.1 3.2 11.3C3.3 11.3 3.4 11.6 3.6 11.8C3.8 12 4.1 12.4 4.2 12.5C4.7 13 5.2 13.7 5.4 13.9C6 14.5 6.5 15.1 6.7 15.3C6.7 15.4 6.9 15.5 6.9 15.7C7.3 15.9 7.7 16.5 7.9 16.8C7.9 16.8 8 16.9 8 16.9C8.1 16.9 8.2 17.2 8.2 17.3C8.2 17.3 8.1 17.2 8.1 17.1C7.9 16.9 7.9 16.9 7.6 16.6C7.5 16.5 7.4 16.5 7.4 16.3C7.2 16.2 6.7 15.7 6.3 15.2C6.1 15.1 6 14.9 6 14.9C5.9 14.8 5.7 14.7 5.7 14.6C5.6 14.5 5.4 14.3 5.3 14.2C5.1 14.1 4.9 13.8 4.7 13.5C4.5 13.3 4.2 13.1 4.1 12.9C4.1 12.9 3.8 12.7 3.8 12.5C3.5 12.3 3 11.8 2.8 11.4C1.8 10.5 0.9 9.6 0.7 9.6C0.6 9.7 0.6 9.8 0.5 10C0.5 10.1 0.6 10.2 0.5 10.3C0.5 10.4 0.6 10.5 0.6 10.6C0.5 10.7 0.5 10.9 0.6 11C0.5 11.1 0.6 11.4 0.6 11.5C0.9 12.9 1.3 13.8 2.8 14.9C2.9 15.1 3.3 15.3 3.4 15.4C3.4 15.5 3.6 15.6 3.7 15.7C4.2 16 6.4 17.8 7 18.4C7.4 18.8 7.4 18.8 7.5 18.9C7.6 19 7.7 19 7.7 19.1C7.7 19.2 7.8 19.2 7.9 19.2C7.9 19.3 8.1 19.4 8.1 19.5C8.2 19.6 8.2 19.7 8.3 19.7C8.3 19.7 8.3 19.7 8.2 19.7C8.2 19.6 8.1 19.6 8 19.6C7.9 19.5 7.9 19.4 7.8 19.4C7.7 19.3 7.6 19.2 7.6 19.2C7.6 19.1 7.5 19 7.3 18.9C7.2 18.9 6.9 18.6 6.7 18.4C6.1 17.8 4.5 16.6 3.5 16C3.4 15.8 3 15.6 2.9 15.5C2.6 15.3 1.5 14.6 0.9 14.3C0.7 14.1 0.6 14.1 0.6 14.2C0.5 14.5 0.8 15.9 0.9 16.1C0.9 16.2 1 16.2 0.9 16.3C1.2 16.8 1.9 17.6 2.7 18.3C2.8 18.5 4 19.2 4.7 19.5C6.2 20.5 6.6 20.7 7.4 21.5C8.2 22.2 8.7 22.7 9.3 23.6C9.5 24.1 9.9 24.4 10.3 25.3C10.4 25.5 10.5 25.8 10.5 25.8C10.7 25.8 10.8 25.7 11 25.4C11.6 25 11.9 24.6 12.3 24.3C12.8 24 13 23.8 13 23.7C13.1 23.7 13.1 23.8 13 24C12 24.8 11 26 10.2 26.9C10.1 27.1 9.9 27.5 9.7 27.7C9.5 27.8 9.4 28 9.4 28C9.4 28 9.3 28.3 9.1 28.5C8.6 29.2 7.7 30.8 7.7 30.9C7.7 31 7.8 31 8.3 30.8C9 30.4 9.5 30.2 10.4 30C11.7 29.6 12.5 29.6 11.6 30C10.5 30.2 9.7 30.6 9.2 31.2C8.8 31.7 8.8 31.7 9.3 31.7C10.1 31.8 10.9 31.9 11.6 32.2C12.8 32.7 13.5 33.1 15.5 34.8C16.4 35.5 17.3 36.2 17.8 36.4C17.9 36.5 18.1 36.7 18.2 36.8C19.1 37.3 21.2 38.1 22.3 38.3C22.4 38.3 22.7 38.3 22.8 38.3C22.8 38.5 23 38.5 23 38.5C23.1 38.5 23.2 38.5 23.3 38.5C23.6 38.6 25.9 38.6 26.1 38.5C26.2 38.5 26.3 38.5 26.4 38.5C26.5 38.5 26.6 38.5 26.7 38.3C26.7 38.3 27 38.3 27.1 38.3C28.3 38.1 30.2 37.3 31.4 36.7C31.5 36.7 31.7 36.4 31.8 36.4C32.2 36.2 33.2 35.4 33.4 35.2C34.2 34.5 35.5 33 35.8 32.6C35.8 32.5 36 32.2 36.1 32C36.4 31.8 36.6 31.4 36.6 31.2C36.7 31.1 36.8 30.9 36.9 30.8C37.2 30.4 37.5 29.6 37.7 29.2C37.7 29.1 37.8 28.7 37.9 28.7C38.1 28.5 38.4 27.1 38.5 26.8C39 25.2 39.1 23.7 39 22.4C39 22.2 38.9 21.9 38.9 21.8C38.9 21.7 38.9 21.6 38.9 21.4C38.6 20.5 38.5 19.9 38.2 19C37.9 18.5 37.5 17.5 37.3 17.2C37 16.8 36.8 15.8 36.8 15.2C36.8 13.8 37.7 12.7 39.6 12.2C40.1 12.1 41.3 11.8 42.1 11.7C43.5 11.5 43.5 11.5 43.4 11.3C42.9 10.7 40.9 9.9 39.2 9.7C37.9 9.5 38.1 9.5 37.6 9C37 8.6 36.4 8 36 7.9C36 7.8 35.8 7.8 35.7 7.7C35.1 7.3 34.2 7 33.1 6.9C32.6 6.7 31.6 6.9 31 7C29.6 7.3 28.3 8 27.3 9.2C26.7 9.8 26.2 10.8 25.7 11.7C25.5 12.1 24.8 13.4 24.7 13.7C24.6 13.9 24.5 14.1 24.1 14.7C23.5 15.7 22.1 16.9 20.6 17.8C20.5 18 20.3 18.2 20.1 18.3C19.7 18.5 19.4 18.8 19.1 19C18.9 19.1 18.7 19.3 18.5 19.4C18 19.8 17.2 20.3 17 20.5C16.9 20.5 16.8 20.6 16.7 20.7C16.3 20.8 16.1 20.9 16 20.9C15.5 20.8 14.9 20.5 14.2 20.2C13.7 19.8 12.7 18.9 12.4 18.6C12.3 18.5 12.2 18.4 12.1 18.2C11.9 18 11.2 17.1 11 16.6C10.9 16.5 10.8 16.4 10.7 16.3C10.7 16.2 10.6 16.1 10.6 15.9C10.5 15.9 10.4 15.7 10.4 15.6C10.3 15.5 10.2 15.2 10.1 15C10 14.8 9.8 14.4 9.7 14.2C9.6 14 9.5 13.7 9.4 13.6C9.4 13.4 9.3 13.2 9.2 13C9.2 12.8 9 12.6 9 12.5C8.9 12.3 8.7 12.1 8.7 12C8.7 12 8.5 11.7 8.5 11.7C8.3 11.2 8.2 10.9 7.5 10C6.4 8.3 4.2 6.4 2.7 5.8C2 5.5 1.6 5.4 1.5 5.5ZM28.4 16.7C29.2 16.9 29.7 17.2 29.9 17.7C30.1 18.2 30 18.9 29.6 19.4C29.2 19.9 28.2 20.9 27.6 21.2C26.8 21.7 25.3 22.4 24.2 22.7C23.9 22.8 23.6 22.9 23.5 22.9C22.8 23.2 20.7 23.7 19.6 24C19 24.2 18.4 24.3 18.1 24.4C17.9 24.4 16.1 24.9 15.3 25.1C14.6 25.2 14.7 25.1 15.7 23.6C16.4 22.7 18.5 20.6 19.4 19.9C20.8 18.8 21.4 18.4 23.2 17.6C23.8 17.4 25.6 16.8 25.9 16.8C25.9 16.8 26.3 16.8 26.6 16.7C26.8 16.7 28.2 16.7 28.4 16.7ZM30.4 20.2C30.5 20.3 30.6 20.6 30.6 20.7C31.7 23.1 33.4 24.6 35.6 25.3C36.1 25.5 36.7 25.7 37.2 25.8C37.7 25.8 37.8 25.9 37.8 26.1C37.7 26.2 37.7 26.3 37.7 26.5C37.7 26.6 37.7 26.8 37.6 27C37.4 28.5 36.8 29.9 36.1 31C36.1 31.2 35.9 31.4 35.9 31.6C35.7 31.9 35.2 32.6 34.7 33.3C32.6 35.6 29.7 37.3 26.6 37.8C26.5 37.8 26.3 37.9 26.2 37.9C25.8 37.9 23.7 37.9 23.3 37.9C23.2 37.9 23 37.8 22.9 37.8C21.1 37.6 19.3 36.8 18 35.7C17.7 35.4 17 34.7 16.8 34.5C16.3 33.8 16.1 33 16.3 32.5C16.5 31.8 16.8 31.6 17.9 31.1C19.1 30.5 19.4 30.4 20.2 30C21.4 29.4 23.2 28.4 23.9 27.9C23.9 27.8 24.2 27.7 24.5 27.6C26.3 26.3 28 24.6 28.9 22.9C29.5 22.2 29.7 21.6 29.9 20.7C30.1 20 30.2 19.9 30.4 20.2Z\"/></svg>";
		const settingsCss = `
.dmg-settings{display:flex;flex-direction:column;gap:16px;max-width:620px;font-size:13px;line-height:1.5;color:var(--dsw-alias-label-primary);min-width:0}
.dmg-settings h3{margin:0;font-size:14px;line-height:22px;font-weight:500}
.dmg-settings h4{margin:0;font-size:13px;line-height:20px;font-weight:500}
.dmg-settings p{margin:0}
.dmg-intro,.dmg-hint,.dmg-meta{color:var(--dsw-alias-label-tertiary);font-size:12px;overflow-wrap:anywhere}
.dmg-panel{display:flex;flex-direction:column;gap:10px;padding:12px 14px;border:.5px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l4));border-radius:16px;background:var(--dsw-alias-settings-card-fill,var(--dsw-alias-bg-layer-2))}
.dmg-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.dmg-head{display:flex;align-items:center;gap:8px;justify-content:space-between}
.dmg-field{display:flex;flex-direction:column;gap:4px}
.dmg-field>span{color:var(--dsw-alias-label-secondary);font-size:12px}
.dmg-input,.dmg-select{box-sizing:border-box;min-width:0;height:32px;padding:0 10px;border:.5px solid var(--dsw-alias-border-l4);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit}
.dmg-select{height:26px;padding:0 6px;font-size:12px}
.dmg-input:focus-visible,.dmg-select:focus-visible,.dmg-button:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}
.dmg-button{height:26px;padding:0 10px;border:.5px solid var(--dsw-alias-border-l4);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;cursor:pointer;white-space:nowrap}
.dmg-button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.dmg-button:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}
.dmg-error{color:var(--dsw-alias-state-error-primary);font-size:12px;overflow-wrap:anywhere;white-space:pre-wrap}
.dmg-ok{color:var(--dsw-alias-label-secondary);font-size:12px}
.dmg-usage{display:flex;flex-direction:column;gap:6px}
.dmg-advanced>summary{cursor:pointer;color:var(--dsw-alias-label-secondary);font-size:12px}
.dmg-advanced-body{display:flex;flex-direction:column;gap:10px;margin-top:10px;padding-left:10px;border-left:.5px solid var(--dsw-alias-border-l2)}
.dmg-cards{display:flex;flex-direction:column;gap:8px}
.dmg-card{display:flex;flex-direction:column;gap:6px;padding:8px 10px;border:.5px solid var(--dsw-alias-border-l2);border-radius:12px}
.dmg-card-title{display:flex;align-items:center;gap:8px;min-width:0}
.dmg-card-title>strong{font-weight:500;overflow-wrap:anywhere}
.dmg-card-title>.dmg-button{margin-left:auto}
.dmg-facts{display:flex;flex-wrap:wrap;gap:2px 12px;color:var(--dsw-alias-label-tertiary);font-size:12px}
.dmg-facts>span>b{font-weight:400;color:var(--dsw-alias-label-secondary)}
.dmg-window{display:flex;flex-direction:column;gap:3px}
.dmg-window-line{display:flex;justify-content:space-between;gap:8px;font-size:12px;color:var(--dsw-alias-label-secondary)}
.dmg-window-line time{color:var(--dsw-alias-label-tertiary)}
.dmg-track{height:6px;border-radius:3px;overflow:hidden;background:var(--dsw-alias-border-l2)}
.dmg-fill{height:100%;background:var(--dsw-alias-state-business-primary);border-radius:3px}
.dmg-fill[data-level=warn]{background:var(--dsw-alias-state-warn-primary)}
.dmg-fill[data-level=high]{background:var(--dsw-alias-state-error-primary)}
.dmg-resets{font-size:12px;color:var(--dsw-alias-label-tertiary)}
.dmg-resets>summary{display:flex;align-items:center;gap:6px;cursor:pointer;list-style:none;color:var(--dsw-alias-label-secondary)}
.dmg-resets>summary::-webkit-details-marker{display:none}
.dmg-resets>summary:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px;border-radius:8px}
.dmg-reset-chevron-slot{display:inline-flex;flex:none;width:12px;height:12px;align-items:center;justify-content:center;color:var(--dsw-alias-label-tertiary);transition:transform 100ms ease}
.dmg-resets[open]>summary .dmg-reset-chevron-slot{transform:rotate(90deg)}
.dmg-resets-count{margin-left:auto;color:var(--dsw-alias-label-tertiary);white-space:nowrap}
.dmg-reset-items{display:flex;flex-direction:column;gap:2px;margin-top:6px;padding-left:18px}
.dmg-reset-item{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:28px;color:var(--dsw-alias-label-tertiary)}
.dmg-reset-kind{display:inline-flex;align-items:center;gap:8px;flex:none;color:var(--dsw-alias-label-secondary)}
.dmg-reset-when{margin-left:auto;text-align:right}
.dmg-reset-use{height:22px;min-height:22px;padding:0 7px;border:.5px solid var(--dsw-alias-border-l4);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;line-height:1;cursor:pointer;white-space:nowrap}
.dmg-reset-use:hover[data-ready]{background:var(--dsw-alias-interactive-bg-hover)}
.dmg-reset-use[aria-disabled=true]{opacity:.4;cursor:not-allowed}
.dmg-reset-use:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}
.dmg-reset-item time{color:var(--dsw-alias-label-tertiary)}
.dmg-warn{color:var(--dsw-alias-state-warn-primary);font-size:12px;overflow-wrap:anywhere}
.dmg-modal-backdrop{position:fixed;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;padding:24px;background:var(--dsw-alias-bg-mask-1,#0006)}
.dmg-modal{position:static;display:flex;flex-direction:column;gap:8px;max-width:420px;width:100%;padding:16px 18px;border:.5px solid var(--dsw-alias-border-l4);border-radius:16px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.5}
.dmg-modal h3{margin:0;font-size:14px;font-weight:500}
.dmg-check-list{display:flex;flex-direction:column;gap:4px}
.dmg-check-row{display:flex;align-items:flex-start;gap:8px;font-size:12px;color:var(--dsw-alias-label-secondary)}
.dmg-check-row input{margin:2px 0 0}
.dmg-models{display:flex;flex-direction:column}
.dmg-model{display:flex;align-items:center;gap:8px;padding:6px 0;border-top:.5px solid var(--dsw-alias-border-l2)}
.dmg-model label{display:flex;align-items:center;gap:6px;min-width:0;flex:1}
.dmg-model label>span{overflow-wrap:anywhere}
.dmg-model code{font-size:11px;color:var(--dsw-alias-label-tertiary)}
.dmg-info{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;border:.5px solid var(--dsw-alias-border-l3);color:var(--dsw-alias-label-tertiary);font-size:11px;cursor:default}
.dmg-lines{display:flex;flex-direction:column;gap:8px}
.dmg-line{border:.5px solid var(--dsw-alias-border-l2);border-radius:12px;padding:6px 8px 6px 6px;display:flex;flex-direction:column;gap:8px;background:var(--dsw-alias-bg-layer-1)}
.dmg-line-head{display:flex;align-items:center;gap:8px;min-width:0}
.dmg-line-toggle{flex:1;display:flex;align-items:center;gap:8px;min-width:0;margin:0;padding:2px 4px;border:0;border-radius:8px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
.dmg-line-toggle:hover{background:var(--dsw-alias-interactive-bg-hover)}
.dmg-line-toggle:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}
.dmg-chevron{display:inline-flex;flex:none;width:16px;height:16px;align-items:center;justify-content:center;color:var(--dsw-alias-label-tertiary);transition:transform 100ms ease}
.dmg-line[data-expanded=true] .dmg-chevron{transform:rotate(90deg)}
.dmg-line-index{font-weight:500;white-space:nowrap}
.dmg-line-title{color:var(--dsw-alias-label-tertiary);font-size:12px;overflow-wrap:anywhere;min-width:0;flex:1}
.dmg-active{width:4px;height:4px;flex:none;background:var(--dmg-active,#22c55e)}
.dmg-line-actions{display:flex;gap:2px;flex:none;margin-left:auto}
.dmg-icon-button{width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;padding:0;border:0;border-radius:var(--dsw-radius-sm,8px);background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer}
.dmg-icon-button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}
.dmg-icon-button:focus-visible{outline:2px solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:1px}
.dmg-icon-button:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}
.dmg-icon{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px}
.dmg-latency{display:inline-flex;align-items:center;gap:4px;flex:none;font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}
.dmg-latency[data-latency-state=failed]{color:var(--dsw-alias-label-dimmed)}
.dmg-bars{display:inline-flex;align-items:flex-end;gap:2px;height:11px}
.dmg-bars i{display:block;width:3px;border-radius:1px;background:var(--dsw-alias-border-l3);height:4px}
.dmg-bars i:nth-child(2){height:6px}
.dmg-bars i:nth-child(3){height:8px}
.dmg-bars i:nth-child(4){height:10px}
.dmg-bars i[data-on=true]{background:var(--dsw-alias-state-success-primary)}
.dmg-bars[data-level="2"] i[data-on=true],.dmg-bars[data-level="1"] i[data-on=true]{background:var(--dsw-alias-state-warn-primary)}
.dmg-bars[data-level="0"] i[data-on=true]{background:var(--dsw-alias-label-dimmed)}
.dmg-latency-text{white-space:nowrap;min-width:0}
.dmg-unset{padding:0 6px;border:.5px solid var(--dsw-alias-border-l3);border-radius:8px;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:18px;white-space:nowrap}
.dmg-check{display:flex;flex-direction:column;gap:6px;padding-top:4px;border-top:.5px dashed var(--dsw-alias-border-l2)}
.dmg-check-line{margin:0;font-size:12px;color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere}
.dmg-check-line[data-check-kind=ok]{color:var(--dsw-alias-label-primary)}
.dmg-check-models>summary{cursor:pointer;font-size:12px;color:var(--dsw-alias-label-secondary)}
.dmg-check-models p{margin:4px 0 0;overflow-wrap:anywhere}
.dmg-line-body{display:flex;flex-direction:column;gap:10px;padding:2px 4px 2px 10px;border-left:.5px solid var(--dsw-alias-border-l2)}
.dmg-speed{position:relative;display:inline-flex}
.dmg-speed-trigger{border:.5px solid var(--dsw-alias-border-l3);border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;line-height:18px;padding:2px 8px;cursor:pointer;white-space:nowrap}
.dmg-speed-trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.dmg-speed-menu{position:absolute;bottom:100%;right:0;margin-bottom:4px;min-width:180px;padding:4px;z-index:20;display:flex;flex-direction:column;gap:2px;border-radius:16px;background:var(--dsw-alias-bg-layer-2);box-shadow:0 8px 28px var(--dsw-alias-bg-mask-1,#0003)}
.dmg-speed-item{display:flex;align-items:flex-start;gap:6px;width:100%;border:none;border-radius:8px;background:transparent;padding:6px 8px;cursor:pointer;font:inherit;text-align:left;color:var(--dsw-alias-label-primary)}
.dmg-speed-item:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.dmg-speed-item>span:first-child{width:14px;flex:none;font-size:12px}
.dmg-speed-item small{display:block;font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary)}

/* ── sidebar usage card (sidebar.footer.action) ─────────────────────────── */
.dmg-sidebar{flex:1;min-width:0;display:flex;flex-direction:column}
.dmg-sidebar-card{position:relative;margin:0 2px 6px;padding:6px 9px 4px;border:0;border-radius:12px;background:var(--dsw-alias-bg-layer-2);box-shadow:0 1px 2px #0000000f,0 4px 14px #0000000d;display:flex;flex-direction:column;min-width:0}
[data-ds-dark-theme] .dmg-sidebar-card{box-shadow:0 1px 2px #00000033,0 4px 14px #0000002e}
.dmg-sidebar-head{display:flex;align-items:center;gap:5px;height:22px;flex:none;min-width:0;cursor:pointer}
.dmg-sidebar-bird{flex:none;width:15px;height:15px;background-color:var(--dsw-alias-label-secondary);${`-webkit-mask-image:url("data:image/svg+xml,${encodeURIComponent(birdSvg)}");mask-image:url("data:image/svg+xml,${encodeURIComponent(birdSvg)}");-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:center;mask-position:center;-webkit-mask-size:contain;mask-size:contain`}}
.dmg-sidebar-title{font-size:12px;font-weight:500;color:var(--dsw-alias-label-primary);white-space:nowrap}
.dmg-sidebar-fresh{margin-left:auto;font-size:10px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;white-space:nowrap}
.dmg-sidebar-icon{width:18px;height:18px;flex:none;border:0;border-radius:5px;padding:0;background:transparent;color:var(--dsw-alias-label-tertiary);display:inline-flex;align-items:center;justify-content:center;cursor:pointer}
.dmg-sidebar-icon:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}
.dmg-sidebar-icon:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}
.dmg-sidebar-icon:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}
.dmg-sidebar-icon svg{width:12px;height:12px}
.dmg-sidebar-chevron{transition:transform .15s ease}
.dmg-sidebar-chevron.is-open{transform:rotate(180deg)}
.dmg-sidebar-body{max-height:320px;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:none;-ms-overflow-style:none;margin-top:2px}
.dmg-sidebar-body.is-scroll{-webkit-mask-image:linear-gradient(to bottom,#000 calc(100% - 6px),rgba(0,0,0,.6));mask-image:linear-gradient(to bottom,#000 calc(100% - 6px),rgba(0,0,0,.6))}
.dmg-sidebar-body::-webkit-scrollbar{display:none;width:0;height:0}
.dmg-sidebar-row{padding:2px 0 3px;min-width:0}
.dmg-sidebar-row-line{display:flex;align-items:baseline;gap:5px;min-width:0}
.dmg-sidebar-label{display:flex;align-items:baseline;gap:2px;flex:1;min-width:0;overflow:hidden}
.dmg-sidebar-name{flex:0 1 auto;min-width:0;font-size:12px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dmg-sidebar-window{flex:none;font-size:10px;color:var(--dsw-alias-label-tertiary);white-space:nowrap}
.dmg-sidebar-expiry{flex:none;font-size:10px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;white-space:nowrap}
.dmg-sidebar-expiry.is-unknown{color:var(--dsw-alias-label-dimmed)}
.dmg-sidebar-row.is-multi{padding:4px 0 5px}
.dmg-sidebar-account{flex:0 1 auto;min-width:0;font-size:12px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dmg-sidebar-plan{flex:none;margin-left:4px;font-size:10px;color:var(--dsw-alias-label-tertiary);white-space:nowrap}
.dmg-sidebar-group{padding:2px 0}
.dmg-sidebar-group+.dmg-sidebar-row,.dmg-sidebar-row+.dmg-sidebar-group,.dmg-sidebar-group+.dmg-sidebar-group{margin-top:4px}
.dmg-sidebar-group-title{display:flex;align-items:baseline;gap:6px;min-width:0;font-size:12px;color:var(--dsw-alias-label-primary)}
.dmg-sidebar-group-label{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dmg-sidebar-count{flex:none;font-size:10px;color:var(--dsw-alias-label-tertiary)}
.dmg-sidebar-group>.dmg-sidebar-row{padding-left:8px}
.dmg-sidebar-account-line{display:flex;align-items:baseline;min-width:0}
.dmg-sidebar-account-line+.dmg-sidebar-row-line{margin-top:1px}
.dmg-sidebar-group-name{display:flex;align-items:baseline;min-width:0;font-size:12px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dmg-sidebar-win-row{display:flex;align-items:baseline;gap:5px;min-width:0;margin-top:3px}
.dmg-sidebar-win-label{flex:1;min-width:0;font-size:10.5px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dmg-sidebar-row.is-multi .dmg-sidebar-bar{margin-top:2px}
.dmg-sidebar-pct{flex:none;min-width:36px;text-align:right;font-size:11.5px;color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums}
.dmg-sidebar-pct[data-level=warn]{color:var(--dsw-alias-state-warn-label)}
.dmg-sidebar-pct[data-level=high]{color:var(--dsw-alias-state-error-primary)}
.dmg-sidebar-bar{height:3px;border-radius:2px;overflow:hidden;background:var(--dsw-alias-border-l2);margin-top:3px}
.dmg-sidebar-bar>i{display:block;height:100%;border-radius:2px;background:var(--dsw-alias-state-business-primary)}
.dmg-sidebar-bar>i[data-level=warn]{background:var(--dsw-alias-state-warn-primary)}
.dmg-sidebar-bar>i[data-level=high]{background:var(--dsw-alias-state-error-primary)}
.dmg-sidebar-row-error{margin:2px 0 0;font-size:10.5px;line-height:15px;color:var(--dsw-alias-state-error-primary);overflow-wrap:anywhere}
.dmg-sidebar-more{flex:none;height:16px;display:flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-tertiary)}
.dmg-sidebar-more.is-hidden{visibility:hidden}
.dmg-sidebar-more svg{width:12px;height:12px}
.dmg-sidebar-status{margin:2px 0 4px;font-size:10.5px;line-height:15px;color:var(--dsw-alias-label-tertiary);overflow-wrap:anywhere}
.dmg-sidebar-rule{border-top:.5px solid var(--dsw-alias-border-l2);margin:4px 0 6px;flex:none}
.dmg-sidebar-detail{max-height:min(60vh,520px);overflow-y:auto;overscroll-behavior:contain;margin-top:6px;scrollbar-width:none;-ms-overflow-style:none}
.dmg-sidebar-detail::-webkit-scrollbar{display:none;width:0;height:0}
.dmg-sidebar-prov+ .dmg-sidebar-prov,.dmg-sidebar-group+.dmg-sidebar-prov,.dmg-sidebar-prov+.dmg-sidebar-group,.dmg-sidebar-group:has(>.dmg-sidebar-prov)+.dmg-sidebar-group{border-top:.5px solid var(--dsw-alias-border-l2);margin-top:6px;padding-top:6px}
.dmg-sidebar-prov-head{display:block;min-width:0}
.dmg-sidebar-prov-head strong{display:block;font-weight:500;font-size:12.5px;color:var(--dsw-alias-label-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dmg-sidebar-meta{display:block;margin-top:1px;font-size:10px;color:var(--dsw-alias-label-tertiary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dmg-sidebar-win{margin-top:5px}
.dmg-sidebar-win-line{display:flex;align-items:baseline;gap:6px;min-width:0;font-size:10.5px}
.dmg-sidebar-win-name{min-width:0;font-size:10.5px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dmg-sidebar-reset{margin-left:auto;flex:none;font-size:10px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;white-space:nowrap}
.dmg-sidebar-foot{margin-top:4px;display:flex;flex-wrap:wrap;gap:2px 8px;font-size:10px;color:var(--dsw-alias-label-tertiary)}
.dmg-sidebar-foot b{font-weight:400;color:var(--dsw-alias-label-secondary)}
.dmg-sidebar-error{margin:3px 0 0;font-size:10.5px;line-height:15px;color:var(--dsw-alias-state-error-primary);overflow-wrap:anywhere}
.dmg-sidebar-rail{width:36px;height:36px;flex:none;border:0;border-radius:10px;background:transparent;color:var(--dsw-alias-label-secondary);display:inline-flex;align-items:center;justify-content:center;cursor:pointer}
.dmg-sidebar-rail:hover,.dmg-sidebar-rail[aria-expanded=true]{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.dmg-sidebar-rail:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}
.dmg-sidebar-rail .dmg-sidebar-bird{width:20px;height:20px}
.dmg-sidebar-popover{position:fixed;z-index:1100;box-sizing:border-box;max-height:min(62vh,560px);overflow-y:auto;overscroll-behavior:contain;scrollbar-width:none;-ms-overflow-style:none;background:var(--dsw-specific-menu);border:0;border-radius:16px;box-shadow:0 6px 24px #00000033,0 2px 8px #0000001a;padding:12px 14px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);backdrop-filter:blur(20px)}
[data-ds-dark-theme] .dmg-sidebar-popover{box-shadow:0 10px 34px #00000080,0 2px 10px #0000004d}
.dmg-sidebar-popover::-webkit-scrollbar{display:none;width:0;height:0}
/* settings page: the sidebar preference switch */
.dmg-switch-row{display:flex;align-items:flex-start;gap:12px;padding-top:2px}
.dmg-switch-row>span{flex:1;min-width:0;font-size:13px;line-height:20px;color:var(--dsw-alias-label-primary)}
.dmg-switch{flex:none;width:36px;height:20px;margin-top:1px;padding:2px;border:0;border-radius:999px;background:var(--dsw-alias-border-l4);display:inline-flex;align-items:center;cursor:pointer}
.dmg-switch[aria-checked=true]{background:var(--dsw-alias-state-business-primary);justify-content:flex-end}
.dmg-switch:disabled{cursor:default;opacity:.6}
.dmg-switch:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}
.dmg-switch>i{display:block;width:16px;height:16px;border-radius:999px;background:#fff}
.dmg-switch-hint{margin:6px 0 0;font-size:11.5px;line-height:17px;color:var(--dsw-alias-label-tertiary)}
.dmg-refresh-row{display:flex;align-items:center;gap:12px;margin-top:12px;font-size:13px;color:var(--dsw-alias-label-primary)}
.dmg-refresh-row>span:first-child{flex:1;min-width:0}
.dmg-refresh-control{display:inline-flex;align-items:center;gap:6px}
.dmg-refresh-input{width:64px;height:28px;box-sizing:border-box;padding:0 8px;border:1px solid var(--dsw-alias-border-l3);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-variant-numeric:tabular-nums}
.dmg-refresh-input:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}
.dmg-refresh-input:disabled{opacity:.6}
.dmg-refresh-unit{font-size:12px;color:var(--dsw-alias-label-tertiary)}
`;
		/** Marker on the document-level stylesheet so a re-apply can find it again. */
		const STYLE_ATTR = "data-dmg-magpie-styles";
		/**
		* Add the plugin stylesheet to `document.head` once and return it.
		*
		* The styles must not live inside a component: the settings section, the wide
		* sidebar card and the rail popover are three different slot/portal trees, and a
		* slot remount or a client-plugin reload that drops one of those subtrees used
		* to take the `<style>` element with it — leaving the card as raw text (the
		* classic "unstyled after a rebuild/restart" symptom). Document-level injection
		* with a marker keeps the sheet independent of any mount lifecycle.
		*/
		function ensureStyles() {
			if (typeof document === "undefined" || document.head === null) return null;
			const existing = document.head.querySelector(`style[${STYLE_ATTR}]`);
			if (existing !== null) return existing;
			const element = document.createElement("style");
			element.setAttribute(STYLE_ATTR, "");
			element.textContent = settingsCss;
			document.head.append(element);
			return element;
		}
		// src/client/locales.ts
		/**
		* Copy dictionaries for the Magpie settings page and its usage/speed controls.
		*
		* The plugin deliberately avoids `dsh-client-*` type packages (its settings UI is
		* plain `h()` over a hand-rolled context), so this file carries both the
		* dictionaries and the module-scoped translator instead of importing the shared
		* LocaleNamespaceMap base. `apply()` binds the real `ctx.locale.bind(NS)`
		* translator once; before that (unit tests, any embedding without a locale
		* service) the module falls back to the Chinese reference set, so behaviour is
		* unchanged for existing tests and for a host that never provides `locale`.
		*
		* Placeholders use the host's `{name}` syntax; interpolation happens here so the
		* fallback path and the bound path behave identically.
		*
		* @module dsh-magpie-connector/client/locales
		*/
		/** The locale namespace this plugin owns. */
		const NS = "settings.magpie";
		/** English strings (reference key set; values may contain `{placeholders}`). */
		const en = {
			intro: "Use models through a self-hosted Magpie gateway. Usage cards are read-only: they are read once when this page opens, and only again when you click refresh on a card.",
			settingsReadFailed: "Could not read settings: {error}",
			readingSettings: "Reading settings…",
			usageReading: "Reading usage…",
			usageForbidden: "The current gateway key may not read usage",
			usageUnconfigured: "Fill in the gateway address and key before reading usage",
			usageError: "Reading usage failed",
			usageEmpty: "Magpie returned no visible usage",
			restrictedHint: "A restricted gateway key cannot make Magpie read usage for the first time: a Magpie admin has to read it once in Magpie, or use an unrestricted key.",
			notReread: "Magpie did not re-read (possibly still inside the throttle window)",
			rereading: "Asking Magpie to re-read…",
			usageLabel: "Usage",
			fetchModelsAndUsage: "Get models and usage",
			envKeyReadonly: "The key comes from the launch environment and cannot be changed here",
			notSaved: "Not saved: {reason}",
			refreshFailed: "Refresh failed: {reason}",
			refreshModels: "Refresh model list",
			modelsRefreshed: "Model list refreshed",
			save: "Save",
			cancel: "Cancel",
			saving: "Saving…",
			addLine: "Add line",
			addBackupLine: "Add backup line",
			connection: "Connection",
			infoText: "Lines are tried in order and the next one is used when a line cannot be reached; the green block marks the current line; all lines should point at the same Magpie gateway; the latency is TCP connect time (including DNS resolution), not a gateway health check.",
			hostnameUnset: "not configured",
			savedLine: "Saved · current line {n}",
			savedNoActive: "Saved · no line in effect",
			noLines: "No lines yet. Click “Add line” to enter a gateway address and key.",
			lineIndex: "Line {n}",
			currentLine: "Current line",
			unsaved: "(unsaved)",
			unconfigured: "Not configured",
			configured: "Configured",
			notConfigured: "Not configured",
			readonlyFromEnv: "(from the launch environment, read-only)",
			baseUrlLabel: "Gateway address (including /v1)",
			apiKeyLabel: "Gateway API key · {state}",
			keepBlank: "Leave blank to keep it unchanged",
			required: "Required",
			checkLine: "Check line",
			checking: "Checking…",
			clear: "Clear",
			checkReadonly: "Read-only snapshot: does not change the current line and writes no configuration.",
			checkUnparsable: "The check result could not be parsed",
			checkFailed: "Check failed: {reason}",
			checkUnsupported: "This host version does not support line checks",
			checkModelCount: "{n} models",
			checkMatchesCache: "matches the cached catalog",
			checkMatchesCacheAt: "matches the cached catalog (cached at {time})",
			checkDiffCounts: "{added} extra · {removed} missing",
			listSeparator: ", ",
			cloudflareAccess: "Cloudflare Access",
			modelIds: "Model ids ({n})",
			diffAdded: "Extra: {list}",
			diffRemoved: "Missing: {list}",
			advanced: "Advanced connection",
			accessMode: "Access mode",
			direct: "Direct",
			accessReadonly: "(Access credentials come from the launch environment, read-only)",
			directHintClears: "Saving will clear the stored Cloudflare Access credentials.",
			directHint: "Choose this when the gateway address is directly reachable (LAN, Tailscale and similar networks).",
			accessFieldLabel: "{field} · {state}",
			cloudflareHint: "Choose this when the gateway sits behind Cloudflare Access: fill in both service token fields, HTTPS only. Leave blank to keep them unchanged.",
			modelsCount: "{n} models · updated ",
			syncFailed: "Sync failed{kind}: {error}",
			syncFailedKind: " ({kind})",
			routeRegistrationFailed: "Magpie route registration failed ({code}{route}): restart the Host to recover.",
			ownersReset: "The owner list was reset: the stored owners were invalid and will be rebuilt on the next sync.",
			ownerLimitReached: "The owner limit (32) is reached; these owners were not added: {list}",
			followCatalog: "Follow the gateway model list",
			visibilityFollow: "Visibility: follows the gateway model list, new models appear automatically",
			visibilityManual: "Visibility: only checked models are shown, new models are hidden by default",
			showInPicker: "Show {label} in the picker",
			defaultEffortAria: "Default effort for {label}",
			defaultEffortNone: "Default: not set",
			routingGroupsTitle: "Routing groups",
			routingGroupsHint: "Create and edit routing groups in Magpie; here you choose whether each appears in DSH and its default reasoning effort",
			routingKindCustom: "Custom",
			routingKindAuto: "Auto",
			effortStale: "{effort} (not currently offered by the gateway, inactive)",
			latencyMeasuring: "Measuring…",
			latencyTimeout: "Timeout",
			latencyTitle: "TCP connect time {ms} ms (including DNS resolution), not a gateway health check",
			latencyTitleTimeout: "TCP connect did not finish within 600 ms (slow or unreachable)",
			moveUp: "Move up",
			moveDown: "Move down",
			remove: "Delete",
			lineAction: "{action} line {line}",
			lineActionReason: "{action} ({reason})",
			firstLine: "already the first line",
			lastLine: "already the last line",
			onlyLine: "only line",
			checkKindOk: "Reachable",
			checkKindUnauthorized: "Invalid key",
			checkKindForbidden: "No access",
			checkKindHttp: "Gateway error",
			checkKindRedirect: "Redirected",
			checkKindUnreachable: "Unreachable",
			checkKindTimeout: "Timeout",
			checkKindInvalidCatalog: "Unparsable catalog",
			checkKindIncomplete: "Incomplete configuration",
			checkKindInvalid: "Invalid request",
			checkKindBusy: "A check is already running",
			checkKindPending: "The host is saving, try again shortly",
			syncKindUnauthorized: "invalid key (401)",
			syncKindForbidden: "no access (403)",
			syncKindHttp: "gateway error",
			syncKindUnreachable: "cannot reach the gateway",
			syncKindSettings: "saving settings failed",
			syncKindRegistration: "route registration failed",
			usageUser: "Account",
			usagePlan: "Plan",
			usageUntil: "Expires",
			usageRenew: "Renewal",
			usageBalance: "Balance",
			usageReadAt: "Read at",
			usageReadAtStale: "Old reading · read at",
			usageResetAt: "Resets at ",
			refresh: "Refresh",
			resetCountLineOne: "Usage limit reset 1 time",
			resetCountLineMany: "Usage limit reset {n} times",
			resetCreditsTitle: "Usage limit resets",
			resetCreditsAvailable: "{n} available",
			resetCreditFull: "Full reset",
			resetCreditExpires: "Expires {date}",
			resetCreditExpiryUnknown: "Expiry date unavailable",
			resetFiveHour: "{n} five-hour",
			resetWeekly: "{n} weekly",
			resetWindowFiveHour: "five-hour",
			resetWindowWeekly: "weekly",
			resetExpired: "expired",
			resetInHours: "in {n}h",
			resetInDays: "in {n}d",
			resetUseButton: "Use…",
			resetUseChecking: "Checking…",
			resetUseConfirming: "Spending…",
			resetUseGuard: "You can use this reset once weekly usage reaches 80%.",
			resetUseRefresh: "Refresh usage to confirm the current limits and reset availability.",
			resetUseRestart: "Reset details are missing. Refresh usage and try again.",
			resetUseReady: "Spend the reset that expires first. This needs confirmation.",
			resetUseConfirmTitle: "Confirm a full reset",
			resetUseWarning: "This spends one reset and restarts the weekly and 5-hour limits. It cannot be undone, and this confirmation expires in 60 seconds.",
			resetUseAcknowledge: "I understand that one reset will be spent.",
			resetUseConfirm: "Spend one reset",
			resetUseSuccess: "Reset confirmed. Usage refreshed.",
			resetUseKept: "Nothing needed resetting, so no reset was spent.",
			resetUseNoCredit: "This account has no reset left.",
			resetUseAlready: "That reset was already used.",
			resetUseUnknown: "The gateway reported “{code}”.",
			resetUseUnconsumed: "The gateway did not run the reset: {reason}",
			resetUseUncertain: "The outcome could not be confirmed. Check the account in Magpie before trying again — do not retry or restart to get around this.",
			resetUseBusy: "Another reset is already in progress. Wait for it to finish.",
			resetUseTicketInvalid: "That confirmation is no longer valid. Start again.",
			resetUseTicketExpired: "That confirmation expired. Start again.",
			resetUseUnavailable: "That reset is no longer available. Refresh and try again.",
			resetUseReadFailed: "Could not read fresh usage, so no reset was submitted.",
			resetUseAccount: "Account",
			resetUseWeekly: "Weekly usage",
			resetUseResetCode: "{windows} windows restarted",
			yes: "Yes",
			no: "No",
			unlimited: "Unlimited",
			sidebarTitle: "Magpie usage",
			sidebarAccountCount: "{n} accounts",
			sidebarAccountN: "Account {n}",
			sidebarPanelTitle: "Sidebar usage",
			sidebarToggle: "Show usage in the sidebar",
			sidebarToggleHint: "Keeps a usage card at the bottom of the sidebar: one row per upstream for its weekly window by default (pick the windows below); the collapsed body caps at 320px and scrolls, and the header row opens every window. Read-only — it does not change routing, model choice or generation.",
			sidebarWindowLabel: "Windows in the card",
			sidebarWindowWeekly: "Weekly (7 days)",
			sidebarWindowFiveHour: "5-hour",
			sidebarWindowMonthly: "Monthly (30 days)",
			sidebarWindowsHint: "Every ticked window gets its own line: one tick keeps the dense single row (the window name in brackets after the account), several ticks put the account on its own line with one line and one bar per window. When an upstream does not report the ticked windows, the row falls back to a window it does have, the gateway’s own text reading, or the balance — nothing is invented.",
			sidebarWindowAtLeastOne: "Keep at least one window selected",
			sidebarResetUnknown: "The gateway reports no reset time for this window",
			sidebarWindowFallbackTitle: "This upstream has none of the ticked windows; showing {window}",
			sidebarExpand: "Show all usage",
			sidebarCollapse: "Collapse usage",
			sidebarRefreshLabel: "Auto refresh",
			sidebarRefreshUnit: "min",
			sidebarRefreshHint: "How often the card re-reads usage, in minutes. 0 turns auto refresh off; 5 is the default.",
			sidebarJustNow: "just now",
			sidebarMinutesAgo: "{n} min ago",
			sidebarHoursAgo: "{n} h ago",
			sidebarDaysAgo: "{n} d ago",
			usageReadingFailed: "Read failed",
			speedTierStandard: "Standard",
			speedTierStandardDescription: "Default speed and usage",
			speedTierFast: "Fast",
			speedTierFastDescription: "Requests carry the priority service tier: faster, but consumes more usage",
			speedLabel: "Speed · {tier}",
			speedSaveFailed: "Speed was not saved, please retry",
			speedMenu: "Speed"
		};
		/** Simplified Chinese strings; the reference implementation this plugin shipped with. */
		const zh = {
			intro: "通过自托管的 Magpie 网关使用模型。用量卡片只读，打开本页时读取一次，之后只在你点击卡片上的刷新时重新读取。",
			settingsReadFailed: "无法读取设置：{error}",
			readingSettings: "正在读取设置…",
			usageReading: "正在读取用量…",
			usageForbidden: "当前 gateway key 无权读取用量",
			usageUnconfigured: "填写网关地址和 key 后才能读取用量",
			usageError: "读取用量失败",
			usageEmpty: "Magpie 未返回可见用量",
			restrictedHint: "受限的 gateway key 无法让 Magpie 首次读取用量：需要 Magpie 管理员先在 Magpie 中读取一次，或者改用不受限的 key。",
			notReread: "Magpie 未重新读取（可能处于节流间隔内）",
			rereading: "正在请求 Magpie 重新读取…",
			usageLabel: "用量",
			fetchModelsAndUsage: "获取模型与用量",
			envKeyReadonly: "key 来自启动环境，不能在这里修改",
			notSaved: "未保存：{reason}",
			refreshFailed: "刷新失败：{reason}",
			refreshModels: "刷新模型列表",
			modelsRefreshed: "已刷新模型列表",
			save: "保存",
			cancel: "取消",
			saving: "保存中…",
			addLine: "添加线路",
			addBackupLine: "添加备用线路",
			connection: "连接",
			infoText: "线路按序号优先尝试，连不上自动试下一条；绿色方块表示当前线路；多条线路应指向同一个 Magpie 网关；延迟是 TCP 建连耗时（含 DNS 解析），不是网关健康检查。",
			hostnameUnset: "未配置",
			savedLine: "已保存 · 当前线路 {n}",
			savedNoActive: "已保存 · 当前无生效线路",
			noLines: "还没有线路。点击「添加线路」填写网关地址与 key。",
			lineIndex: "线路 {n}",
			currentLine: "当前线路",
			unsaved: "（未保存）",
			unconfigured: "未配置",
			configured: "已配置",
			notConfigured: "未配置",
			readonlyFromEnv: "（来自启动环境，只读）",
			baseUrlLabel: "网关地址（含 /v1）",
			apiKeyLabel: "Gateway API key · {state}",
			keepBlank: "留空则保持不变",
			required: "必填",
			checkLine: "检查线路",
			checking: "检查中…",
			clear: "清除",
			checkReadonly: "只读快照：不改当前线路，也不写入配置。",
			checkUnparsable: "检查结果无法解析",
			checkFailed: "检查失败：{reason}",
			checkUnsupported: "当前宿主版本不支持线路检查",
			checkModelCount: "{n} 个模型",
			checkMatchesCache: "与缓存目录一致",
			checkMatchesCacheAt: "与缓存目录一致（缓存于 {time}）",
			checkDiffCounts: "多 {added} · 少 {removed}",
			listSeparator: "、",
			cloudflareAccess: "Cloudflare Access",
			modelIds: "模型 id（{n}）",
			diffAdded: "多出：{list}",
			diffRemoved: "缺少：{list}",
			advanced: "高级连接",
			accessMode: "接入方式",
			direct: "直连",
			accessReadonly: "（Access 凭据来自启动环境，只读）",
			directHintClears: "保存后将清除已保存的 Cloudflare Access 凭据。",
			directHint: "网关地址可直接访问时选择（局域网、Tailscale 等组网后的地址）。",
			accessFieldLabel: "{field} · {state}",
			cloudflareHint: "网关在 Cloudflare Access 之后时选择：填写服务令牌的两项，仅支持 HTTPS。留空保持不变。",
			modelsCount: "共 {n} 个模型 · 更新于 ",
			syncFailed: "同步失败{kind}：{error}",
			syncFailedKind: "（{kind}）",
			routeRegistrationFailed: "Magpie 路由注册失败（{code}{route}）：需重启 Host 后才能恢复。",
			ownersReset: "归属列表已重置：已保存的归属无效，下次同步会重新建立。",
			ownerLimitReached: "归属数量已达上限（32 个），以下归属未能加入：{list}",
			followCatalog: "跟随网关模型列表",
			visibilityFollow: "可见性：跟随网关模型列表，新上架的模型自动出现",
			visibilityManual: "可见性：只显示勾选的模型，新上架的模型默认隐藏",
			showInPicker: "在选择器中显示 {label}",
			defaultEffortAria: "{label} 默认 effort",
			defaultEffortNone: "默认：不指定",
			routingGroupsTitle: "路由组",
			routingGroupsHint: "在 Magpie 中新建和编辑路由组；这里决定是否在 DSH 显示及默认推理强度",
			routingKindCustom: "自定义",
			routingKindAuto: "自动",
			effortStale: "{effort}（网关当前不提供，暂不生效）",
			latencyMeasuring: "测速中…",
			latencyTimeout: "超时",
			latencyTitle: "TCP 建连耗时 {ms} ms（含 DNS 解析），不是网关健康检查",
			latencyTitleTimeout: "600ms 内未完成 TCP 建连（可能很慢或不可达）",
			moveUp: "上移",
			moveDown: "下移",
			remove: "删除",
			lineAction: "{action}线路 {line}",
			lineActionReason: "{action}（{reason}）",
			firstLine: "已是第一条",
			lastLine: "已是最后一条",
			onlyLine: "仅剩一条",
			checkKindOk: "可达",
			checkKindUnauthorized: "key 无效",
			checkKindForbidden: "无权访问",
			checkKindHttp: "网关错误",
			checkKindRedirect: "被重定向",
			checkKindUnreachable: "连不上",
			checkKindTimeout: "超时",
			checkKindInvalidCatalog: "目录无法解析",
			checkKindIncomplete: "配置不完整",
			checkKindInvalid: "请求无效",
			checkKindBusy: "已有检查在进行",
			checkKindPending: "宿主正在保存，稍后再试",
			syncKindUnauthorized: "key 无效（401）",
			syncKindForbidden: "无权访问（403）",
			syncKindHttp: "网关错误",
			syncKindUnreachable: "无法连接网关",
			syncKindSettings: "设置保存失败",
			syncKindRegistration: "路由注册失败",
			usageUser: "账号",
			usagePlan: "计划",
			usageUntil: "到期",
			usageRenew: "续订",
			usageBalance: "余额",
			usageReadAt: "读取于",
			usageReadAtStale: "旧读数 · 读取于",
			usageResetAt: "重置于 ",
			refresh: "刷新",
			resetCountLineOne: "用量限制重置 1 次",
			resetCountLineMany: "用量限制重置 {n} 次",
			resetCreditsTitle: "用量限制重置",
			resetCreditsAvailable: "可用 {n} 次",
			resetCreditFull: "完整重置",
			resetCreditExpires: "{date} 到期",
			resetCreditExpiryUnknown: "到期时间不可用",
			resetFiveHour: "5 小时 {n} 次",
			resetWeekly: "每周 {n} 次",
			resetWindowFiveHour: "5 小时",
			resetWindowWeekly: "每周",
			resetExpired: "已过期",
			resetInHours: "{n} 小时后过期",
			resetInDays: "{n} 天后过期",
			resetUseButton: "使用…",
			resetUseChecking: "正在检查…",
			resetUseConfirming: "正在提交…",
			resetUseGuard: "每周用量达到 80% 后才可使用此重置。",
			resetUseRefresh: "请刷新用量，确认当前限额与重置可用性。",
			resetUseRestart: "缺少重置详情。请刷新用量后重试。",
			resetUseReady: "使用最早到期的这张重置，操作前需要确认。",
			resetUseConfirmTitle: "确认完整重置",
			resetUseWarning: "将消耗一次重置额度，重置每周与 5 小时限额。无法撤销，确认 60 秒后失效。",
			resetUseAcknowledge: "我理解将消耗一次额度。",
			resetUseConfirm: "消耗一次重置",
			resetUseSuccess: "重置已确认，用量已刷新。",
			resetUseKept: "没有需要重置的窗口，额度未消耗。",
			resetUseNoCredit: "该账号已没有可用的重置额度。",
			resetUseAlready: "这张重置已被使用。",
			resetUseUnknown: "网关返回了「{code}」。",
			resetUseUnconsumed: "网关没有执行重置：{reason}",
			resetUseUncertain: "结果无法确认。请先在 Magpie 核对账号状态再试，不要依靠重试或重启绕过。",
			resetUseBusy: "已有重置操作在进行，请等它完成。",
			resetUseTicketInvalid: "确认已失效，请重新开始。",
			resetUseTicketExpired: "确认已过期，请重新开始。",
			resetUseUnavailable: "这张重置已不可用，请刷新后重试。",
			resetUseReadFailed: "无法读取最新用量，未提交重置。",
			resetUseAccount: "账号",
			resetUseWeekly: "每周用量",
			resetUseResetCode: "{windows} 个窗口已重置",
			yes: "是",
			no: "否",
			unlimited: "无限",
			sidebarTitle: "Magpie 用量",
			sidebarAccountCount: "{n} 个账号",
			sidebarAccountN: "账号 {n}",
			sidebarPanelTitle: "侧边栏用量",
			sidebarToggle: "在侧边栏常驻显示用量",
			sidebarToggleHint: "在左侧栏底部常驻一张用量卡片：每个上游一行，默认显示周窗口（7 days）读数（可在下方勾选档位），收起正文最高 320px、超出在卡内滚动；点开标题行可看全部窗口（文字读数只在设置页显示）。只读，不改变路由、模型选择与生成。",
			sidebarWindowLabel: "卡片显示的窗口",
			sidebarWindowWeekly: "周窗口（7 days）",
			sidebarWindowFiveHour: "5 小时窗口",
			sidebarWindowMonthly: "月窗口（30 days）",
			sidebarWindowsHint: "勾选的档位各占一行：只勾一个时是单行（名称后括号跟窗口名），勾多个时上游名称单独一行、每个档位一行并各带进度条。网关没有勾选的档位时，退回它可用的窗口、网关自己的文字读数或余额，不会编造。",
			sidebarWindowAtLeastOne: "至少保留一个档位",
			sidebarResetUnknown: "网关没有提供这个窗口的重置时间",
			sidebarWindowFallbackTitle: "该上游没有勾选的档位，这里显示{window}",
			sidebarExpand: "展开全部用量",
			sidebarCollapse: "收起用量",
			sidebarRefreshLabel: "自动刷新",
			sidebarRefreshUnit: "分钟",
			sidebarRefreshHint: "卡片重新读取用量的间隔（分钟）。0 表示关闭自动刷新，默认 5 分钟。",
			sidebarJustNow: "刚刚",
			sidebarMinutesAgo: "{n} 分钟前",
			sidebarHoursAgo: "{n} 小时前",
			sidebarDaysAgo: "{n} 天前",
			usageReadingFailed: "读取失败",
			speedTierStandard: "标准",
			speedTierStandardDescription: "默认速度与用量",
			speedTierFast: "快速",
			speedTierFastDescription: "请求带 priority 服务档，更快但消耗更多用量",
			speedLabel: "速度 · {tier}",
			speedSaveFailed: "速度未保存，请重试",
			speedMenu: "速度"
		};
		let bound;
		/** Bind the host translator. Called once from the client entry (`apply`). */
		function bindLocale(translator) {
			bound = translator;
		}
		/** Interpolate `{name}` placeholders; unknown names stay verbatim. */
		function interpolate(template, params) {
			if (!params) return template;
			return template.replace(/\{(\w+)\}/g, (match, name) => name in params ? String(params[name]) : match);
		}
		/**
		* Translate one key. Without a bound translator the Chinese reference set is
		* used, so unit tests and any embedding without a locale service keep the copy
		* this plugin shipped with.
		*/
		function t(key, params) {
			return interpolate(bound === void 0 ? zh[key] : bound(key), params);
		}
		// src/client/view-model.ts
		/**
		* Client-side shapes of the D10 resources. Every field the host may omit is
		* optional here and is simply not rendered when absent — the page never
		* fabricates placeholders or inferred values.
		*/
		/** Visibility key and settings section of every routing entry (host `ROUTING_OWNER`). */
		const ROUTING_PROVIDER = "routing";
		const str = (value) => typeof value === "string" && value !== "";
		/** Defensive parse of the line-check response: no fabricated fields, unknown kinds dropped. */
		function parseCheck(body) {
			const raw = body && typeof body === "object" ? body : {};
			if (!str(raw.kind) || typeof raw.latencyMs !== "number" || !Number.isFinite(raw.latencyMs)) return void 0;
			const models = Array.isArray(raw.models) ? raw.models.filter((entry) => !!entry && typeof entry === "object" && str(entry.id)).map((entry) => ({ id: entry.id })) : void 0;
			return {
				kind: raw.kind,
				latencyMs: Math.max(0, Math.round(raw.latencyMs)),
				...typeof raw.gatewayStatus === "number" ? { gatewayStatus: raw.gatewayStatus } : {},
				...str(raw.reason) ? { reason: raw.reason } : {},
				...typeof raw.modelCount === "number" ? { modelCount: raw.modelCount } : {},
				...models ? { models } : {},
				...str(raw.testedAt) ? { testedAt: raw.testedAt } : {}
			};
		}
		/** Everything that makes a snapshot stale for one card: identity plus unsaved credential edits. */
		const checkSignature = (draft) => JSON.stringify([
			draft.id ?? null,
			draft.baseUrl.trim(),
			draft.accessMode,
			draft.apiKey,
			draft.accessClientId,
			draft.accessClientSecret
		]);
		/** Cached catalog ids the snapshot is compared against (never the live "current line" catalog). */
		const cacheIds = (groups) => (groups ?? []).flatMap((group) => group.models.map((model) => model.id));
		/**
		* Diff against the cached catalog. Comparing only complete model ids keeps both sides comparable:
		* the cache exposes raw `provider` keys while the check result carries no ownership at all.
		*/
		function checkDiff(snapshot, cache) {
			if (!snapshot.models) return void 0;
			const have = new Set(snapshot.models.map((model) => model.id));
			const known = new Set(cache);
			return {
				added: [...have].filter((id) => !known.has(id)),
				removed: [...known].filter((id) => !have.has(id))
			};
		}
		/** Defensive parse: unknown or malformed entries never reach the renderer. */
		function parseCards(body, httpStatus) {
			const raw = body && typeof body === "object" ? body : {};
			const ok = httpStatus >= 200 && httpStatus < 300;
			const status = [
				"ok",
				"forbidden",
				"error",
				"unconfigured"
			].includes(raw.status) ? raw.status : httpStatus === 403 ? "forbidden" : ok ? "ok" : "error";
			const cards = Array.isArray(raw.cards) ? raw.cards.filter((c) => !!c && typeof c === "object" && str(c.provider)) : [];
			return {
				status,
				...str(raw.error) ? { error: raw.error } : {},
				cards
			};
		}
		/** Time string from the gateway: a parseable instant renders localized, anything else verbatim. */
		function formatTime(raw) {
			const time = Date.parse(raw);
			return Number.isNaN(time) ? raw : new Date(time).toLocaleString();
		}
		/**
		* How far a reset credit's expiry still is, as "in N days" / "in N hours" /
		* "expired". Undefined when the gateway string is not an instant, so nothing
		* is invented for it.
		*/
		function expiryHint(raw, now = Date.now()) {
			const at = Date.parse(raw);
			if (Number.isNaN(at)) return void 0;
			const left = at - now;
			if (left <= 0) return t("resetExpired");
			const hours = Math.ceil(left / 36e5);
			return hours < 24 ? t("resetInHours", { n: hours }) : t("resetInDays", { n: Math.ceil(left / 864e5) });
		}
		/** Window reading, by precedence unlimited > display > used%. Undefined means "show no reading". */
		function windowReading$1(window) {
			if (window.unlimited === true) return t("unlimited");
			if (str(window.display)) return window.display;
			if (typeof window.used === "number" && Number.isFinite(window.used)) return `${Math.round(window.used * 10) / 10}%`;
		}
		const readTime = (card) => card.readAt ?? card.asOf;
		const cardKey$1 = (card) => `${card.provider}\u0000${card.user ?? ""}`;
		const sameTarget = (a, b) => a.provider === b.provider && (a.user ?? void 0) === (b.user ?? void 0);
		/** The weekly window the reset guard reads; the gateway names Codex windows by their span. */
		const RESET_WEEKLY_WINDOW = "7 days";
		/**
		* Client-side pre-check for the reset button. It only decides whether the button
		* looks disabled and why — the host revalidates every condition against a fresh
		* card read before it spends anything.
		*/
		function resetBlock(card, now = Date.now()) {
			const weekly = card.windows?.find((window) => window.name === RESET_WEEKLY_WINDOW);
			if (!weekly || typeof weekly.used !== "number" || !Number.isFinite(weekly.used)) return "refresh";
			if (weekly.used < 80) return "guard";
			const resetsAt = weekly.resetsAt === void 0 ? NaN : Date.parse(weekly.resetsAt);
			if (Number.isNaN(resetsAt) || resetsAt <= now) return "refresh";
			if (card.error) return "refresh";
			if (card.resets?.redeemable !== true) return "restart";
		}
		/** The account a reset would be spent for; only a named Codex card offers one. */
		const resetAccount = (card) => card.provider === "codex" && card.resets?.redeemable === true && str(card.user) ? card.user : void 0;
		const num = (value) => typeof value === "number" && Number.isFinite(value);
		/** Defensive parse of a prepare response: a ticket is the only required field. */
		function parseResetTicket(body) {
			const raw = body && typeof body === "object" ? body : {};
			if (!str(raw.ticket)) return void 0;
			return {
				ticket: raw.ticket,
				...str(raw.expiresAt) ? { expiresAt: raw.expiresAt } : {},
				...num(raw.weeklyUsedPercent) ? { weeklyUsedPercent: raw.weeklyUsedPercent } : {},
				...str(raw.creditExpiresAt) ? { creditExpiresAt: raw.creditExpiresAt } : {}
			};
		}
		/** Defensive parse of a consume response; `cards` is adopted only when it is a real list. */
		function parseResetOutcome(body) {
			const raw = body && typeof body === "object" ? body : {};
			if (!str(raw.outcome)) return void 0;
			const cards = Array.isArray(raw.cards) ? raw.cards.filter((card) => !!card && typeof card === "object" && str(card.provider)) : void 0;
			return {
				outcome: raw.outcome,
				...str(raw.code) ? { code: raw.code } : {},
				...num(raw.windows) ? { windows: raw.windows } : {},
				...str(raw.error) ? { error: raw.error } : {},
				...cards ? { cards } : {}
			};
		}
		/** Provider groups in page order: catalog groups first, then card-only providers (never dropped). */
		function providerOrder(groups, cards) {
			const order = groups.map((g) => g.provider).sort((a, b) => Number(b === ROUTING_PROVIDER) - Number(a === ROUTING_PROVIDER));
			for (const card of cards) if (!order.includes(card.provider)) order.push(card.provider);
			return order;
		}
		// src/client/UsageCard.ts
		/**
		* One usage card. Every gateway string is a React text child (never HTML),
		* absent fields are omitted. The only controls are "刷新" and — on a card whose
		* resets the host marked redeemable — "使用…" on the credit that expires first.
		*/
		const time = (raw) => (0, react.createElement)("time", { dateTime: raw }, formatTime(raw));
		/** A reset credit's expiry: the localized instant, "expires …", in one machine-readable `<time>`. */
		const expiryTime = (raw) => (0, react.createElement)("time", { dateTime: raw }, t("resetCreditExpires", { date: formatTime(raw) }));
		const fact = (field, label, value) => (0, react.createElement)("span", {
			"data-field": field,
			key: field
		}, (0, react.createElement)("b", null, `${label} `), (0, react.createElement)("span", { "data-value": "" }, value));
		const scalar = (value) => typeof value === "boolean" ? value ? t("yes") : t("no") : String(value);
		const present = (value) => value !== void 0 && value !== null && value !== "";
		/** Children on one line, separated by the page's inline separator. */
		const inline = (nodes) => nodes.flatMap((node, index) => index === 0 ? [node] : [" · ", node]);
		/** Which window a reset credit is for, when the gateway names one it knows. */
		const windowLabel$1 = (window) => window === "fiveHour" ? t("resetWindowFiveHour") : window === "weekly" ? t("resetWindowWeekly") : void 0;
		/** Bar colour: ≤70% normal (blue), above 70 and below 90 warn (orange), 90% and above high (red). */
		const usageLevel = (used) => used >= 90 ? "high" : used > 70 ? "warn" : "normal";
		/** The reset area's disclosure arrow: a 12px glyph, so the unfolded rows line up with the title text. */
		const ResetChevron = () => (0, react.createElement)("svg", {
			className: "dmg-reset-chevron",
			"aria-hidden": true,
			width: 12,
			height: 12,
			viewBox: "0 0 16 16"
		}, (0, react.createElement)("path", {
			d: "m6 3 5 5-5 5",
			fill: "none",
			stroke: "currentColor",
			strokeWidth: 1.5,
			strokeLinecap: "round",
			strokeLinejoin: "round"
		}));
		function WindowRow({ window }) {
			const reading = windowReading$1(window);
			const showReset = reading !== void 0 && window.unlimited !== true && !present(window.display) && present(window.resetsAt);
			const used = typeof window.used === "number" && reading?.endsWith("%") ? Math.max(0, Math.min(100, window.used)) : void 0;
			return (0, react.createElement)("div", {
				className: "dmg-window",
				"data-window": ""
			}, (0, react.createElement)("div", { className: "dmg-window-line" }, (0, react.createElement)("span", null, present(window.name) ? (0, react.createElement)("span", { "data-window-name": "" }, window.name) : null, present(window.name) && reading !== void 0 ? " " : null, reading !== void 0 ? (0, react.createElement)("span", { "data-reading": "" }, reading) : null), showReset ? (0, react.createElement)("span", null, t("usageResetAt"), time(window.resetsAt)) : null), used !== void 0 ? (0, react.createElement)("div", {
				className: "dmg-track",
				"aria-hidden": true
			}, (0, react.createElement)("div", {
				className: "dmg-fill",
				"data-level": usageLevel(used),
				style: { width: `${used}%` }
			})) : null);
		}
		/** The count half of the reset summary: one count, or a count per window for plans handing out one kind each. */
		function resetCount(resets) {
			if (resets.byWindow === true) {
				const parts = inline([...typeof resets.fiveHour === "number" && resets.fiveHour > 0 ? [(0, react.createElement)("span", { "data-reset-five-hour": "" }, t("resetFiveHour", { n: resets.fiveHour }))] : [], ...typeof resets.weekly === "number" && resets.weekly > 0 ? [(0, react.createElement)("span", { "data-reset-weekly": "" }, t("resetWeekly", { n: resets.weekly }))] : []]);
				return parts.length ? (0, react.createElement)("span", { "data-reset-count": "" }, ...parts) : null;
			}
			return typeof resets.count === "number" ? (0, react.createElement)("span", { "data-reset-count": "" }, t("resetCreditsAvailable", { n: resets.count })) : null;
		}
		/** One reset credit: which kind it is, when it runs out and, for the soonest, how far off that is. */
		function resetItem(item, soonest, key, action) {
			const at = item.until;
			const hint = present(at) && soonest !== void 0 && Date.parse(at) === soonest ? expiryHint(at) : void 0;
			return (0, react.createElement)("div", {
				className: "dmg-reset-item",
				"data-reset-item": "",
				key
			}, (0, react.createElement)("span", { className: "dmg-reset-kind" }, (0, react.createElement)("span", null, windowLabel$1(item.window) ?? t("resetCreditFull")), action === void 0 ? null : action), (0, react.createElement)("span", { className: "dmg-reset-when" }, present(at) ? expiryTime(at) : t("resetCreditExpiryUnknown"), hint === void 0 ? null : [" · ", hint]));
		}
		/** The "use" button of one credit: disabled state is explained on hover, never silently inert. */
		function resetButton(card, busy, blocked, onReset) {
			const reason = resetBlock(card);
			const label = busy ? t("resetUseChecking") : t("resetUseButton");
			const title = busy ? t("resetUseChecking") : reason === "guard" ? t("resetUseGuard") : reason === "refresh" ? t("resetUseRefresh") : reason === "restart" ? t("resetUseRestart") : t("resetUseReady");
			const inactive = busy || blocked || reason !== void 0;
			return (0, react.createElement)("button", {
				type: "button",
				className: "dmg-reset-use",
				"data-reset-use": "",
				"aria-disabled": inactive ? "true" : "false",
				title,
				...inactive ? {} : { "data-ready": "" },
				onClick: () => {
					if (!inactive) onReset?.();
				}
			}, label);
		}
		/**
		* The card's reset credits, folded like the subscriptions plugin does: the count
		* on the summary line, every credit and its expiry when opened, and the use
		* action on the credit that runs out first.
		*/
		function ResetLine({ card, resets, busy, blocked, onReset }) {
			const each = resets.each ?? [];
			const items = each.length ? each : present(resets.until) ? [{ until: resets.until }] : [];
			const times = items.flatMap((item) => {
				const at = present(item.until) ? Date.parse(item.until) : NaN;
				return Number.isNaN(at) ? [] : [at];
			});
			const soonest = times.length ? Math.min(...times) : void 0;
			const count = resetCount(resets);
			if (count === null && items.length === 0) return null;
			const actionable = resets.redeemable === true && resetAccount(card) !== void 0 && onReset !== void 0;
			return (0, react.createElement)("details", {
				className: "dmg-resets",
				"data-field": "resets"
			}, (0, react.createElement)("summary", null, (0, react.createElement)("span", {
				className: "dmg-reset-chevron-slot",
				"aria-hidden": true
			}, (0, react.createElement)(ResetChevron, null)), (0, react.createElement)("span", null, t("resetCreditsTitle")), count === null ? null : (0, react.createElement)("span", { className: "dmg-resets-count" }, count)), items.length ? (0, react.createElement)("div", { className: "dmg-reset-items" }, ...items.map((item, index) => {
				const at = present(item.until) ? Date.parse(item.until) : NaN;
				const isSoonest = soonest === void 0 ? index === 0 : !Number.isNaN(at) && at === soonest;
				return resetItem(item, soonest, `reset-${index}`, actionable && isSoonest ? resetButton(card, busy, blocked, () => onReset(card)) : void 0);
			})) : null);
		}
		function UsageCard({ card, busy, onRefresh, disabled, resetBusy, resetStatus, onReset }) {
			const read = readTime(card);
			const facts = [
				present(card.user) && fact("user", t("usageUser"), card.user),
				present(card.plan) && fact("plan", t("usagePlan"), card.plan),
				present(card.until) && fact("until", t("usageUntil"), time(card.until)),
				present(card.renew) && fact("renew", t("usageRenew"), scalar(card.renew)),
				present(card.balance) && fact("balance", t("usageBalance"), scalar(card.balance)),
				present(read) && fact("readAt", card.asOf !== void 0 ? t("usageReadAtStale") : t("usageReadAt"), time(read))
			].filter(Boolean);
			const resets = card.resets;
			return (0, react.createElement)("article", {
				className: "dmg-card",
				"data-card": ""
			}, (0, react.createElement)("div", { className: "dmg-card-title" }, (0, react.createElement)("strong", null, present(card.name) ? card.name : card.provider), (0, react.createElement)("button", {
				type: "button",
				className: "dmg-button",
				disabled: busy || disabled === true,
				onClick: onRefresh
			}, t("refresh"))), facts.length ? (0, react.createElement)("div", { className: "dmg-facts" }, ...facts) : null, ...(card.windows ?? []).map((window, index) => (0, react.createElement)(WindowRow, {
				key: `window-${index}`,
				window
			})), resets ? (0, react.createElement)(ResetLine, {
				resets,
				card,
				busy: resetBusy === true,
				blocked: disabled === true,
				onReset
			}) : null, resetStatus ? (0, react.createElement)("p", {
				className: resetStatus.tone === "error" ? "dmg-error" : resetStatus.tone === "warn" ? "dmg-warn" : "dmg-ok",
				role: resetStatus.tone === "error" ? "alert" : "status",
				"data-reset-status": resetStatus.tone
			}, resetStatus.text) : null, present(card.error) ? (0, react.createElement)("p", {
				className: "dmg-error",
				"data-field": "error",
				role: "alert"
			}, card.error) : null);
		}
		// src/shared/sidebar-window.ts
		/** Canonical order: 5-hour, weekly, monthly (also the order of a card's window lines). */
		const SIDEBAR_WINDOW_KINDS = [
			"fiveHour",
			"weekly",
			"monthly"
		];
		/** Before this setting existed the card showed the weekly window only. */
		const DEFAULT_SIDEBAR_WINDOWS = ["weekly"];
		const isSidebarWindowKind = (value) => typeof value === "string" && SIDEBAR_WINDOW_KINDS.includes(value);
		/**
		* Validate and canonicalise a stored or requested selection: a non-empty subset
		* of the known kinds, deduplicated and reordered canonically. `null` means the
		* whole value is invalid (unknown member, empty list, not an array) so callers
		* reject it instead of silently repairing it.
		*/
		function normalizeSidebarWindows(value) {
			if (!Array.isArray(value) || value.length === 0) return null;
			if (!value.every(isSidebarWindowKind)) return null;
			return SIDEBAR_WINDOW_KINDS.filter((kind) => value.includes(kind));
		}
		/** Upper bound of the configurable interval; 0 disables auto-refresh. */
		const MAX_REFRESH_MINUTES = 1440;
		const sanitizeMinutes = (value) => {
			if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 1440) return 5;
			return value;
		};
		const sanitizeWindows = (value) => normalizeSidebarWindows(value) ?? [...DEFAULT_SIDEBAR_WINDOWS];
		let preference;
		let hydration;
		const listeners = /* @__PURE__ */ new Set();
		const readSidebarPreference = () => preference;
		function setSidebarPreference(patch) {
			const next = {
				usage: patch.usage ?? preference?.usage,
				refreshMinutes: patch.refreshMinutes ?? preference?.refreshMinutes ?? 5,
				windows: patch.windows ?? preference?.windows ?? [...DEFAULT_SIDEBAR_WINDOWS]
			};
			if (preference !== void 0 && preference.usage === next.usage && preference.refreshMinutes === next.refreshMinutes && preference.windows.join() === next.windows.join()) return;
			preference = next;
			for (const listener of listeners) listener(next);
		}
		function subscribeSidebarPreference(listener) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		}
		/** Read `sidebarUsage`, `sidebarRefreshMinutes` and `sidebarWindows` once per page; a failed read stays retryable. */
		function hydrateSidebarPreference(api) {
			if (api === void 0) return Promise.resolve();
			if (preference !== void 0) return Promise.resolve();
			if (hydration !== void 0) return hydration;
			hydration = (async () => {
				try {
					const response = await api({
						method: "GET",
						path: "settings"
					});
					if (isOk(response)) {
						const body = response.body;
						setSidebarPreference({
							usage: body?.sidebarUsage === true,
							refreshMinutes: sanitizeMinutes(body?.sidebarRefreshMinutes),
							windows: sanitizeWindows(body?.sidebarWindows)
						});
					} else hydration = void 0;
				} catch {
					hydration = void 0;
				}
			})();
			return hydration;
		}
		// src/client/SettingsPage.ts
		/**
		* Magpie settings section: connection (with an advanced access mode), then
		* per-provider groups (model visibility, DSH-side default effort, read-only
		* usage cards). Cards are read once on open or after a connection write; only
		* user refreshes reread upstream usage — each card refreshes itself, and the
		* connection panel offers "Get models and usage" only while no card is shown.
		*/
		const SYNC_KIND = {
			unauthorized: "syncKindUnauthorized",
			forbidden: "syncKindForbidden",
			http: "syncKindHttp",
			unreachable: "syncKindUnreachable",
			settings: "syncKindSettings",
			registration: "syncKindRegistration"
		};
		/** Human labels for the check kinds the host may report. */
		const CHECK_KIND = {
			ok: "checkKindOk",
			unauthorized: "checkKindUnauthorized",
			forbidden: "checkKindForbidden",
			http: "checkKindHttp",
			redirect: "checkKindRedirect",
			unreachable: "checkKindUnreachable",
			timeout: "checkKindTimeout",
			"invalid-catalog": "checkKindInvalidCatalog",
			incomplete: "checkKindIncomplete",
			invalid: "checkKindInvalid",
			busy: "checkKindBusy",
			pending: "checkKindPending"
		};
		const ACCESS_FIELDS = ["accessClientId", "accessClientSecret"];
		/**
		* Does this submitted list touch the active line's identity? Only then the old usage cards must
		* disappear before the request is even sent (the host writes credentials before awaiting its
		* catalog sync, which can take up to 15s).
		*/
		function touchesActiveIdentity(lines, view) {
			const activeId = view.activeLineId;
			if (!activeId) return false;
			const active = (view.lines ?? []).find((line) => line.id === activeId);
			if (!active) return false;
			const entry = lines.filter((line) => !!line && typeof line === "object").find((line) => line.id === activeId);
			if (!entry) return true;
			if (typeof entry.baseUrl === "string" && entry.baseUrl !== (active.baseUrl ?? "")) return true;
			if (typeof entry.accessMode === "string" && entry.accessMode !== (active.accessMode ?? "direct")) return true;
			if (typeof entry.key === "string" && entry.key !== "") return true;
			return ACCESS_FIELDS.some((field) => typeof entry[field] === "string" && entry[field] !== "");
		}
		/** One line of the read-only snapshot: kind, model count, diff against the cache and latency. */
		function describeCheck(snapshot, diff, lastSyncAt) {
			const kindKey = CHECK_KIND[snapshot.kind];
			const parts = [kindKey === void 0 ? snapshot.kind : t(kindKey)];
			if (snapshot.kind === "ok") {
				parts.push(t("checkModelCount", { n: snapshot.modelCount ?? snapshot.models?.length ?? 0 }));
				if (diff) parts.push(diff.added.length === 0 && diff.removed.length === 0 ? lastSyncAt ? t("checkMatchesCacheAt", { time: formatTime(lastSyncAt) }) : t("checkMatchesCache") : t("checkDiffCounts", {
					added: diff.added.length,
					removed: diff.removed.length
				}));
			}
			if (snapshot.gatewayStatus !== void 0) parts.push(`HTTP ${snapshot.gatewayStatus}`);
			parts.push(`${snapshot.latencyMs}ms`);
			return parts.join(" · ");
		}
		function MagpieSettings({ api }) {
			(0, react.useLayoutEffect)(() => {
				ensureStyles();
			});
			const [settings, setSettings] = (0, react.useState)();
			const [settingsError, setSettingsError] = (0, react.useState)("");
			const [cards, setCards] = (0, react.useState)();
			const [refreshing, setRefreshing] = (0, react.useState)();
			const [notice, setNotice] = (0, react.useState)();
			const [noteScope, setNoteScope] = (0, react.useState)();
			const [usageAlert, setUsageAlert] = (0, react.useState)("");
			const [savingSettings, setSavingSettings] = (0, react.useState)(false);
			const [latency, setLatency] = (0, react.useState)({ phase: "idle" });
			const [resetConfirm, setResetConfirm] = (0, react.useState)();
			const [resetBusyKey, setResetBusyKey] = (0, react.useState)();
			const [resetConsuming, setResetConsuming] = (0, react.useState)(false);
			const [resetAcknowledged, setResetAcknowledged] = (0, react.useState)(false);
			const [resetStatuses, setResetStatuses] = (0, react.useState)({});
			const settingsRef = (0, react.useRef)(void 0);
			const settingsVersion = (0, react.useRef)(0);
			const settingsLock = (0, react.useRef)(false);
			const cardsEpoch = (0, react.useRef)(0);
			const latencyEpoch = (0, react.useRef)(0);
			const refreshLock = (0, react.useRef)(false);
			const cardsRef = (0, react.useRef)([]);
			cardsRef.current = cards?.cards ?? [];
			const commitSettings = (view) => {
				settingsRef.current = view;
				setSettings(view);
			};
			const readCards = async (epoch) => {
				try {
					const response = await api({
						method: "GET",
						path: "cards"
					});
					if (epoch === cardsEpoch.current) setCards(parseCards(response.body, response.status));
				} catch (error) {
					if (epoch === cardsEpoch.current) setCards({
						status: "error",
						error: errorText(error),
						cards: []
					});
				}
			};
			/** One measurement per panel open (and after a successful line write); failures stay silent.
			* With `only`, just that saved line is re-measured and merged in — the other rows keep their
			* reading instead of all flipping to the measuring state (the line-check refresh). */
			const readLatency = async (only) => {
				const epoch = ++latencyEpoch.current;
				if (only === void 0) setLatency({ phase: "measuring" });
				else setLatency((current) => current.phase === "done" ? {
					phase: "done",
					readings: current.readings,
					measuring: /* @__PURE__ */ new Set([only])
				} : current);
				const settle = () => {
					if (only === void 0) return;
					setLatency((current) => current.phase === "done" ? {
						phase: "done",
						readings: current.readings
					} : current);
				};
				try {
					const response = await api({
						method: "GET",
						path: "latency",
						...only === void 0 ? {} : { query: { line: only } }
					});
					if (epoch !== latencyEpoch.current) {
						settle();
						return;
					}
					const readings = isOk(response) ? parseLatency(response.body) : void 0;
					if (only === void 0) {
						setLatency(readings ? {
							phase: "done",
							readings
						} : { phase: "failed" });
						return;
					}
					setLatency((current) => {
						const merged = new Map(current.phase === "done" ? current.readings : []);
						if (readings) for (const [id, ms] of readings) merged.set(id, ms);
						return {
							phase: "done",
							readings: merged
						};
					});
				} catch {
					if (epoch !== latencyEpoch.current) {
						settle();
						return;
					}
					if (only === void 0) setLatency({ phase: "failed" });
					else settle();
				}
			};
			const clearUsage = () => {
				const epoch = ++cardsEpoch.current;
				cardsRef.current = [];
				refreshLock.current = false;
				setCards(void 0);
				setRefreshing(void 0);
				setNotice(void 0);
				setUsageAlert("");
				return epoch;
			};
			(0, react.useEffect)(() => {
				const version = ++settingsVersion.current;
				settingsLock.current = false;
				setSavingSettings(false);
				settingsRef.current = void 0;
				setSettings(void 0);
				setSettingsError("");
				const epoch = clearUsage();
				api({
					method: "GET",
					path: "settings"
				}).then((response) => {
					if (version !== settingsVersion.current) return;
					if (isOk(response)) commitSettings(response.body);
					else setSettingsError(failureText(response));
				}, (error) => {
					if (version === settingsVersion.current) setSettingsError(errorText(error));
				});
				readCards(epoch);
				readLatency();
				return () => {
					++settingsVersion.current;
					++cardsEpoch.current;
					++latencyEpoch.current;
				};
			}, [api]);
			/**
			* After an isolated failure the old cards must not come back: reread the host's truth (settings
			* plus cards, both redacted) instead of restoring what the user saw before the write.
			*/
			const rereadAfterFailure = async (epoch) => {
				try {
					const response = await api({
						method: "GET",
						path: "settings"
					});
					if (epoch !== cardsEpoch.current) return;
					if (isOk(response)) {
						commitSettings(response.body);
						readCards(epoch);
					} else setSettingsError(failureText(response));
				} catch (error) {
					if (epoch === cardsEpoch.current) setSettingsError(errorText(error));
				}
			};
			const mutateSettings = async (change) => {
				if (settingsLock.current || !settingsRef.current) return;
				settingsLock.current = true;
				setSavingSettings(true);
				const version = ++settingsVersion.current;
				const body = typeof change === "function" ? change(settingsRef.current) : change;
				const before = settingsRef.current;
				const beforeActive = before.activeLineId ?? null;
				const submitted = Array.isArray(body.lines) ? body.lines : void 0;
				const isolated = submitted !== void 0 && touchesActiveIdentity(submitted, before);
				const epoch = isolated ? clearUsage() : cardsEpoch.current;
				try {
					const result = await postSettings(api, body);
					if (version !== settingsVersion.current) return;
					const switched = !!result.view && (result.view.activeLineId ?? null) !== beforeActive;
					if (result.view) {
						commitSettings(result.view);
						if (submitted !== void 0) readLatency();
						if (isolated) readCards(epoch);
						else if (switched) {
							clearUsage();
							readCards(cardsEpoch.current);
						}
					} else if (isolated) rereadAfterFailure(epoch);
					return result;
				} finally {
					if (version === settingsVersion.current) {
						settingsLock.current = false;
						setSavingSettings(false);
					}
				}
			};
			const renderEpoch = cardsEpoch.current;
			const refresh = async (target) => {
				if (refreshLock.current || renderEpoch !== cardsEpoch.current) return;
				refreshLock.current = true;
				const epoch = renderEpoch;
				setRefreshing(target);
				setNotice(void 0);
				setUsageAlert("");
				setNoteScope("all" in target ? void 0 : target.provider);
				const before = cardsRef.current;
				try {
					const response = await api({
						method: "POST",
						path: "cards",
						body: target
					});
					if (epoch !== cardsEpoch.current) return;
					if (!isOk(response)) {
						setUsageAlert(t("refreshFailed", { reason: failureText(response) }));
						return;
					}
					const next = parseCards(response.body, response.status);
					setCards(next);
					setNotice(noticeAfter(target, before, next));
				} catch (error) {
					if (epoch === cardsEpoch.current) setUsageAlert(t("refreshFailed", { reason: errorText(error) }));
				} finally {
					if (epoch === cardsEpoch.current) {
						refreshLock.current = false;
						setRefreshing(void 0);
					}
				}
			};
			const groups = settings?.groups ?? [];
			const cardList = cards?.cards ?? [];
			const busy = refreshing !== void 0;
			const fetchAll = async () => {
				const result = await mutateSettings({ resync: true });
				if (result?.view) await refresh({ all: true });
				else if (result?.error) {
					setNoteScope(void 0);
					setUsageAlert(result.error);
				}
			};
			const groupNote = (provider) => noteScope === provider ? {
				notice,
				alert: usageAlert
			} : {};
			const setResetStatus = (key, status) => setResetStatuses((current) => {
				const next = { ...current };
				if (status === void 0) delete next[key];
				else next[key] = status;
				return next;
			});
			/**
			* Prepare a reset: the host re-reads the card, revalidates the guard and hands
			* back a one-shot ticket. Nothing is spent until the dialog is confirmed.
			*/
			const startReset = async (card) => {
				const account = resetAccount(card);
				if (!account || resetBusyKey !== void 0 || resetConsuming) return;
				const key = cardKey$1(card);
				setResetBusyKey(key);
				setResetStatus(key, void 0);
				try {
					const response = await api({
						method: "POST",
						path: "reset",
						body: {
							action: "prepare",
							provider: "codex",
							user: account
						}
					});
					const ticket = isOk(response) ? parseResetTicket(response.body) : void 0;
					if (!ticket) {
						setResetStatus(key, {
							text: resetErrorText(response),
							tone: "error"
						});
						return;
					}
					setResetAcknowledged(false);
					setResetConfirm({
						card,
						...ticket
					});
				} catch {
					setResetStatus(key, {
						text: t("resetUseReadFailed"),
						tone: "error"
					});
				} finally {
					setResetBusyKey(void 0);
				}
			};
			/** Spend the prepared credit. Every answer is reported where the button was. */
			const confirmReset = async () => {
				if (!resetConfirm || !resetAcknowledged || resetConsuming) return;
				const key = cardKey$1(resetConfirm.card);
				setResetConsuming(true);
				try {
					const response = await api({
						method: "POST",
						path: "reset",
						body: {
							action: "consume",
							ticket: resetConfirm.ticket
						}
					});
					const outcome = parseResetOutcome(response.body);
					if (!isOk(response) || !outcome) {
						setResetStatus(key, {
							text: resetErrorText(response),
							tone: response.status === 502 ? "warn" : "error"
						});
						return;
					}
					if (outcome.outcome === "reset") {
						if (outcome.cards) setCards(parseCards({
							status: "ok",
							cards: outcome.cards
						}, 200));
						setResetStatus(key, {
							text: outcome.windows === void 0 ? t("resetUseSuccess") : `${t("resetUseSuccess")} · ${t("resetUseResetCode", { windows: outcome.windows })}`,
							tone: "ok"
						});
					} else if (outcome.outcome === "uncertain") setResetStatus(key, {
						text: t("resetUseUncertain"),
						tone: "warn"
					});
					else if (outcome.outcome === "unconsumed") setResetStatus(key, {
						text: t("resetUseUnconsumed", { reason: outcome.error ?? "" }),
						tone: "error"
					});
					else if (outcome.outcome === "kept") setResetStatus(key, {
						text: t("resetUseKept"),
						tone: "ok"
					});
					else if (outcome.outcome === "no-credit") setResetStatus(key, {
						text: t("resetUseNoCredit"),
						tone: "error"
					});
					else if (outcome.outcome === "already") setResetStatus(key, {
						text: t("resetUseAlready"),
						tone: "error"
					});
					else setResetStatus(key, {
						text: t("resetUseUnknown", { code: outcome.code ?? "" }),
						tone: "warn"
					});
				} catch {
					setResetStatus(key, {
						text: t("resetUseUncertain"),
						tone: "warn"
					});
				} finally {
					setResetConsuming(false);
					setResetConfirm(void 0);
				}
			};
			return (0, react.createElement)("div", { className: "dmg-settings" }, (0, react.createElement)("p", { className: "dmg-intro" }, t("intro")), settingsError ? (0, react.createElement)("p", {
				className: "dmg-error",
				role: "alert"
			}, t("settingsReadFailed", { error: settingsError })) : null, settings ? (0, react.createElement)(Connection, {
				settings,
				saving: savingSettings,
				mutateSettings,
				api,
				latency,
				onRefreshLatency: (lineId) => {
					readLatency(lineId);
				},
				usage: (0, react.createElement)(UsageStatus, {
					cards,
					busy,
					...noteScope === void 0 ? {
						notice,
						alert: usageAlert
					} : {},
					onFetchAll: () => {
						fetchAll();
					},
					saving: savingSettings
				})
			}) : settingsError ? null : (0, react.createElement)("p", {
				role: "status",
				className: "dmg-hint"
			}, t("readingSettings")), settings ? (0, react.createElement)(SidebarUsagePreference, {
				settings,
				saving: savingSettings,
				mutateSettings
			}) : null, ...providerOrder(groups, cardList).map((provider) => (0, react.createElement)(ProviderGroup, {
				key: provider,
				provider,
				group: groups.find((g) => g.provider === provider),
				settings,
				cards: cardList.filter((c) => c.provider === provider),
				busy,
				saving: savingSettings,
				mutateSettings,
				...groupNote(provider),
				resetBusyKey,
				resetStatuses,
				onReset: (card) => {
					startReset(card);
				},
				onRefresh: (card) => {
					refresh({
						provider: card.provider,
						...card.user !== void 0 ? { user: card.user } : {}
					});
				}
			})), (0, react.createElement)(ResetDialog, {
				confirm: resetConfirm,
				acknowledged: resetAcknowledged,
				busy: resetConsuming,
				onAcknowledge: setResetAcknowledged,
				onCancel: () => {
					setResetConfirm(void 0);
					setResetAcknowledged(false);
				},
				onConfirm: () => {
					confirmReset();
				}
			}));
		}
		/** What to tell the user after a 2xx refresh: unchanged read times, or a still-empty cold start. */
		function noticeAfter(target, before, next) {
			if ("all" in target) {
				if (next.status === "ok" && next.cards.length === 0) return "restricted";
				const old = new Map(before.map((c) => [cardKey$1(c), readTime(c)]));
				return next.cards.length > 0 && next.cards.every((c) => old.has(cardKey$1(c)) && old.get(cardKey$1(c)) === readTime(c)) ? "not-reread" : void 0;
			}
			const old = before.find((c) => sameTarget(c, target));
			const now = next.cards.find((c) => sameTarget(c, target));
			return old && now && readTime(old) === readTime(now) ? "not-reread" : void 0;
		}
		/**
		* Usage state inside the connection panel. Silent while cards render (each card
		* carries its own refresh); otherwise says why there are none and, when a read
		* could help, offers the one bulk action.
		*/
		function UsageStatus({ cards, busy, saving, notice, alert, onFetchAll }) {
			const state = !cards ? "loading" : cards.status !== "ok" ? cards.status : cards.cards.length ? "ok" : "empty";
			const message = state === "loading" ? t("usageReading") : state === "forbidden" ? t("usageForbidden") : state === "unconfigured" ? t("usageUnconfigured") : state === "error" ? t("usageError") : state === "empty" ? t("usageEmpty") : void 0;
			const canFetch = state === "empty" || state === "error";
			const lines = [
				message ? (0, react.createElement)("p", {
					key: "m",
					className: state === "error" || state === "forbidden" ? "dmg-error" : "dmg-hint",
					role: "status"
				}, message) : null,
				cards?.error && state !== "ok" ? (0, react.createElement)("p", {
					key: "e",
					className: "dmg-error"
				}, cards.error) : null,
				state === "empty" && notice === "restricted" ? (0, react.createElement)("p", {
					key: "r",
					className: "dmg-hint"
				}, t("restrictedHint")) : null,
				notice === "not-reread" ? (0, react.createElement)("p", {
					key: "n",
					className: "dmg-hint",
					role: "status"
				}, t("notReread")) : null,
				busy && canFetch ? (0, react.createElement)("p", {
					key: "b",
					className: "dmg-hint",
					role: "status"
				}, t("rereading")) : null,
				alert ? (0, react.createElement)("p", {
					key: "a",
					className: "dmg-error",
					role: "alert",
					"data-usage-alert": ""
				}, alert) : null
			].filter(Boolean);
			if (!lines.length && !canFetch) return null;
			return (0, react.createElement)("div", {
				className: "dmg-usage",
				"data-usage-state": state,
				"aria-label": t("usageLabel")
			}, ...lines, canFetch ? (0, react.createElement)("div", { className: "dmg-row" }, (0, react.createElement)("button", {
				type: "button",
				className: "dmg-button",
				disabled: busy || saving,
				onClick: onFetchAll
			}, t("fetchModelsAndUsage"))) : null);
		}
		/**
		* Why the host or the gateway said no, in the page's words. The host's codes are
		* fixed strings; anything else falls back to its (already redacted) message.
		*/
		function resetErrorText(response) {
			const reason = response.body?.error;
			const code = typeof reason === "string" ? reason : "";
			if (code === "MAGPIE_RESET_BUSY") return t("resetUseBusy");
			if (code === "MAGPIE_RESET_UNCERTAIN" || code.startsWith("MAGPIE_RESET_UNCERTAIN:")) return t("resetUseUncertain");
			if (code === "MAGPIE_RESET_GUARD") return t("resetUseGuard");
			if (code === "MAGPIE_RESET_UNAVAILABLE" || code === "MAGPIE_RESET_CREDIT_GONE") return t("resetUseUnavailable");
			if (code === "MAGPIE_RESET_REFRESH") return t("resetUseRefresh");
			if (code === "MAGPIE_RESET_TICKET_INVALID") return t("resetUseTicketInvalid");
			if (code === "MAGPIE_RESET_TICKET_EXPIRED") return t("resetUseTicketExpired");
			if (code.startsWith("MAGPIE_RESET_READ_FAILED")) return t("resetUseReadFailed");
			return failureText(response);
		}
		/**
		* The confirmation of an irreversible spend. Rendered as an open `<dialog>` inside
		* a backdrop: the shell has no modal service, and a plain element keeps the page
		* testable without `showModal`. The confirm button stays inert until the box is ticked.
		*/
		function ResetDialog({ confirm, acknowledged, busy, onAcknowledge, onCancel, onConfirm }) {
			if (!confirm) return null;
			const { card } = confirm;
			return (0, react.createElement)("div", {
				className: "dmg-modal-backdrop",
				"data-reset-dialog": ""
			}, (0, react.createElement)("dialog", {
				open: true,
				className: "dmg-modal",
				"aria-labelledby": "dmg-reset-title"
			}, (0, react.createElement)("h3", { id: "dmg-reset-title" }, t("resetUseConfirmTitle")), (0, react.createElement)("p", {
				className: "dmg-hint",
				"data-reset-account": ""
			}, `${t("resetUseAccount")}：${card.user ?? ""}`), confirm.weeklyUsedPercent === void 0 ? null : (0, react.createElement)("p", {
				className: "dmg-hint",
				"data-reset-weekly": ""
			}, `${t("resetUseWeekly")} ${Math.round(confirm.weeklyUsedPercent)}%`), confirm.creditExpiresAt === void 0 ? null : (0, react.createElement)("p", {
				className: "dmg-hint",
				"data-reset-credit": ""
			}, t("resetCreditExpires", { date: formatTime(confirm.creditExpiresAt) })), (0, react.createElement)("p", { className: "dmg-warn" }, t("resetUseWarning")), (0, react.createElement)("label", { className: "dmg-check-row" }, (0, react.createElement)("input", {
				type: "checkbox",
				checked: acknowledged,
				"data-reset-acknowledge": "",
				onChange: (e) => onAcknowledge(e.target.checked)
			}), (0, react.createElement)("span", null, t("resetUseAcknowledge"))), (0, react.createElement)("div", { className: "dmg-row" }, (0, react.createElement)("button", {
				type: "button",
				className: "dmg-button",
				onClick: onCancel
			}, t("cancel")), (0, react.createElement)("button", {
				type: "button",
				className: "dmg-button",
				"data-reset-confirm": "",
				disabled: !acknowledged || busy,
				onClick: onConfirm
			}, busy ? t("resetUseConfirming") : t("resetUseConfirm")))));
		}
		async function postSettings(api, body) {
			try {
				const response = await api({
					method: "POST",
					path: "settings",
					body
				});
				if (isOk(response)) return { view: response.body };
				return { error: response.status === 409 ? t("envKeyReadonly") : t("notSaved", { reason: failureText(response) }) };
			} catch (error) {
				return { error: t("notSaved", { reason: errorText(error) }) };
			}
		}
		const ACCESS_MODES = [{
			id: "direct",
			labelKey: "direct"
		}, {
			id: "cloudflare",
			labelKey: "cloudflareAccess"
		}];
		const hostnameOf = (baseUrl) => {
			try {
				return new URL(baseUrl).hostname || baseUrl;
			} catch {
				return baseUrl || t("hostnameUnset");
			}
		};
		function lineDrafts(settings) {
			const configured = (access) => access?.clientId?.configured === true || access?.clientSecret?.configured === true;
			return (settings.lines ?? []).map((line) => ({
				id: line.id,
				baseUrl: line.baseUrl ?? "",
				accessMode: line.accessMode ?? "direct",
				key: line.key,
				access: line.access,
				complete: line.complete !== false
			})).map((line, index) => ({
				draftId: line.id ?? `new-${index}`,
				...line.id ? { id: line.id } : {},
				baseUrl: line.baseUrl,
				accessMode: line.accessMode,
				savedAccess: line.accessMode === "cloudflare",
				keyConfigured: line.key?.configured === true,
				keyWritable: line.key?.writable !== false,
				apiKey: "",
				accessConfigured: configured(line.access),
				accessWritable: line.access?.clientId?.writable !== false && line.access?.clientSecret?.writable !== false,
				accessClientId: "",
				accessClientSecret: "",
				complete: line.complete
			}));
		}
		const lineSignature = (draft) => JSON.stringify([
			draft.id ?? null,
			draft.baseUrl.trim(),
			draft.accessMode
		]);
		function Connection({ settings, saving, mutateSettings, api, usage, latency, onRefreshLatency }) {
			const baseline = lineDrafts(settings);
			const [drafts, setDrafts] = (0, react.useState)(baseline);
			const [expanded, setExpanded] = (0, react.useState)(null);
			const [message, setMessage] = (0, react.useState)();
			const pendingDraftId = (0, react.useRef)(null);
			const pendingIndex = (0, react.useRef)(null);
			const awaitingSave = (0, react.useRef)(false);
			const keepDrafts = (0, react.useRef)(false);
			const [checks, setChecks] = (0, react.useState)({});
			const [checking, setChecking] = (0, react.useState)();
			const [checkErrors, setCheckErrors] = (0, react.useState)({});
			const [checkUnsupported, setCheckUnsupported] = (0, react.useState)(false);
			const checkLock = (0, react.useRef)(false);
			const checkEpoch = (0, react.useRef)(0);
			(0, react.useEffect)(() => {
				const next = lineDrafts(settings);
				const preserve = keepDrafts.current;
				keepDrafts.current = false;
				if (preserve) setDrafts((current) => current.length === next.length ? current.map((draft, position) => {
					const saved = next[position];
					return {
						...draft,
						...saved.id ? { id: saved.id } : {},
						complete: saved.complete,
						keyConfigured: saved.keyConfigured,
						keyWritable: saved.keyWritable,
						accessConfigured: saved.accessConfigured,
						accessWritable: saved.accessWritable
					};
				}) : current);
				else setDrafts(next);
				if (awaitingSave.current) {
					awaitingSave.current = false;
					const index = pendingIndex.current;
					pendingIndex.current = null;
					setExpanded((current) => current && next.some((draft) => draft.draftId === current) ? current : index !== null && next[index] ? next[index].draftId : null);
					pendingDraftId.current = null;
				} else setExpanded((current) => current && next.some((draft) => draft.draftId === current) ? current : null);
			}, [settings]);
			const activeId = settings.activeLineId ?? null;
			const update = (draftId, patch) => setDrafts((current) => current.map((draft) => draft.draftId === draftId ? {
				...draft,
				...patch
			} : draft));
			const move = (index, delta) => setDrafts((current) => {
				const target = index + delta;
				if (target < 0 || target >= current.length) return current;
				const next = [...current];
				const swap = next[index];
				next[index] = next[target];
				next[target] = swap;
				return next;
			});
			const remove = (draftId) => setDrafts((current) => {
				if (current.length <= 1) return current;
				if (pendingDraftId.current === draftId) pendingDraftId.current = null;
				return current.filter((draft) => draft.draftId !== draftId);
			});
			const add = () => setDrafts((current) => {
				const draft = {
					draftId: `new-${current.length}-${Date.now()}`,
					baseUrl: "",
					accessMode: "direct",
					savedAccess: false,
					keyConfigured: false,
					keyWritable: true,
					apiKey: "",
					accessConfigured: false,
					accessWritable: true,
					accessClientId: "",
					accessClientSecret: "",
					complete: false
				};
				pendingDraftId.current = draft.draftId;
				setExpanded(draft.draftId);
				return [...current, draft];
			});
			const dirty = drafts.length !== baseline.length || drafts.some((draft, index) => {
				const before = baseline[index];
				return !before || lineSignature(draft) !== lineSignature(before) || !!draft.apiKey || draft.accessMode === "cloudflare" && (!!draft.accessClientId || !!draft.accessClientSecret) || draft.accessMode === "direct" && draft.savedAccess;
			});
			const dropChecks = () => {
				checkEpoch.current++;
				checkLock.current = false;
				setChecking(void 0);
				setChecks({});
				setCheckErrors({});
			};
			const post = async (body, done) => {
				setMessage(void 0);
				const result = await mutateSettings(body);
				if (!result?.view) {
					awaitingSave.current = false;
					pendingIndex.current = null;
					keepDrafts.current = true;
				}
				if (!result) return;
				if (result.view) setMessage({
					text: typeof done === "function" ? done(result.view) : done,
					failed: false
				});
				else setMessage({
					text: result.error,
					failed: true
				});
			};
			const savedLabel = (view) => {
				const index = (view.lines ?? []).findIndex((line) => line.id === view.activeLineId);
				return index >= 0 ? t("savedLine", { n: index + 1 }) : t("savedNoActive");
			};
			const save = () => {
				dropChecks();
				const pending = drafts.findIndex((draft) => draft.draftId === pendingDraftId.current && !draft.id);
				pendingIndex.current = pending >= 0 ? pending : null;
				awaitingSave.current = true;
				const lines = drafts.map((draft) => ({
					...draft.id ? { id: draft.id } : {},
					baseUrl: draft.baseUrl.trim(),
					accessMode: draft.accessMode,
					...draft.apiKey ? { key: draft.apiKey } : {},
					...draft.accessMode === "cloudflare" ? {
						...draft.accessClientId ? { accessClientId: draft.accessClientId } : {},
						...draft.accessClientSecret ? { accessClientSecret: draft.accessClientSecret } : {}
					} : draft.savedAccess ? {
						accessClientId: null,
						accessClientSecret: null
					} : {}
				}));
				post({ lines }, (view) => {
					dropChecks();
					return savedLabel(view);
				});
			};
			const runCheck = async (draft) => {
				if (checkLock.current || checkUnsupported) return;
				checkLock.current = true;
				const epoch = ++checkEpoch.current;
				const signature = checkSignature(draft);
				setChecking(draft.draftId);
				setCheckErrors((current) => {
					const next = { ...current };
					delete next[draft.draftId];
					return next;
				});
				try {
					const body = {
						baseUrl: draft.baseUrl.trim(),
						accessMode: draft.accessMode
					};
					if (draft.id) body.id = draft.id;
					if (draft.apiKey) body.key = draft.apiKey;
					if (draft.accessMode === "cloudflare") {
						if (draft.accessClientId) body.accessClientId = draft.accessClientId;
						if (draft.accessClientSecret) body.accessClientSecret = draft.accessClientSecret;
					}
					const response = await api({
						method: "POST",
						path: "line-check",
						body
					});
					if (epoch !== checkEpoch.current) return;
					if (response.status === 404) {
						setCheckUnsupported(true);
						return;
					}
					const snapshot = parseCheck(response.body);
					if (!snapshot) {
						setCheckErrors((current) => ({
							...current,
							[draft.draftId]: isOk(response) ? t("checkUnparsable") : failureText(response)
						}));
						return;
					}
					setChecks((current) => ({
						...current,
						[draft.draftId]: {
							signature,
							activeLineId: activeId,
							result: snapshot
						}
					}));
					if (draft.id) onRefreshLatency(draft.id);
				} catch (error) {
					if (epoch === checkEpoch.current) setCheckErrors((current) => ({
						...current,
						[draft.draftId]: t("checkFailed", { reason: errorText(error) })
					}));
				} finally {
					if (epoch === checkEpoch.current) {
						checkLock.current = false;
						setChecking(void 0);
					}
				}
			};
			const clearCheck = (draftId) => {
				checkEpoch.current++;
				setChecks((current) => {
					const next = { ...current };
					delete next[draftId];
					return next;
				});
				setCheckErrors((current) => {
					const next = { ...current };
					delete next[draftId];
					return next;
				});
			};
			const catalogIds = cacheIds(settings.groups);
			return (0, react.createElement)("section", {
				className: "dmg-panel",
				"aria-label": t("connection")
			}, (0, react.createElement)("div", { className: "dmg-head" }, (0, react.createElement)("h3", null, t("connection")), (0, react.createElement)("span", {
				className: "dmg-info",
				role: "img",
				tabIndex: 0,
				"aria-label": t("infoText"),
				title: t("infoText")
			}, "ⓘ")), drafts.length === 0 ? (0, react.createElement)("p", { className: "dmg-hint" }, t("noLines")) : null, (0, react.createElement)("div", { className: "dmg-lines" }, ...drafts.map((draft, index) => {
				const entry = checks[draft.draftId];
				const fresh = entry && entry.signature === checkSignature(draft) && entry.activeLineId === activeId ? entry : void 0;
				return (0, react.createElement)(LineCard, {
					key: draft.draftId,
					draft,
					index,
					total: drafts.length,
					saving,
					active: !!draft.id && draft.id === activeId,
					expanded: expanded === draft.draftId,
					latency: lineLatency(latency, draft),
					checking: checking === draft.draftId,
					checkDisabled: checking !== void 0 || checkUnsupported,
					check: fresh?.result,
					checkError: checkErrors[draft.draftId],
					diff: fresh?.result && catalogIds.length > 0 && settings.lastSyncAt ? checkDiff(fresh.result, catalogIds) : void 0,
					lastSyncAt: settings.lastSyncAt,
					onToggle: () => setExpanded((current) => current === draft.draftId ? null : draft.draftId),
					onChange: (patch) => update(draft.draftId, patch),
					onMove: (delta) => move(index, delta),
					onRemove: () => remove(draft.draftId),
					onCheck: () => {
						runCheck(draft);
					},
					onClearCheck: () => clearCheck(draft.draftId)
				});
			})), (0, react.createElement)("div", { className: "dmg-row" }, (0, react.createElement)("button", {
				type: "button",
				className: "dmg-button",
				disabled: saving,
				onClick: add
			}, drafts.length ? t("addBackupLine") : t("addLine"))), (0, react.createElement)("div", { className: "dmg-row" }, (0, react.createElement)("button", {
				type: "button",
				className: "dmg-button",
				disabled: saving || !dirty,
				onClick: save
			}, saving ? t("saving") : t("save")), (0, react.createElement)("button", {
				type: "button",
				className: "dmg-button",
				disabled: saving,
				onClick: () => {
					post({ resync: true }, t("modelsRefreshed"));
				}
			}, t("refreshModels"))), (0, react.createElement)(SyncStatus, { settings }), message ? (0, react.createElement)("p", {
				className: message.failed ? "dmg-error" : "dmg-ok",
				...message.failed ? { role: "alert" } : {}
			}, message.text) : null, usage);
		}
		function iconButton(name, icon, lineLabel, disabled, onClick, reason) {
			const action = t("lineAction", {
				action: name,
				line: lineLabel
			});
			const label = disabled && reason ? t("lineActionReason", {
				action,
				reason
			}) : action;
			const button = (0, react.createElement)("button", {
				type: "button",
				className: "dmg-icon-button",
				"aria-label": label,
				"data-action": name,
				disabled,
				onClick
			}, (0, react.createElement)("span", {
				className: "dmg-icon",
				"aria-hidden": true
			}, icon));
			return disabled ? button : (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
				label: action,
				children: button
			});
		}
		/** Per-row latency cell: 4 signal bars plus the reading; only rows that should have a reading are non-idle. */
		function LatencySlot({ latency }) {
			const attrs = {
				className: "dmg-latency",
				"data-latency": "",
				"data-latency-state": latency.state
			};
			const level = latency.level ?? 0;
			if (latency.state === "done") {
				attrs["data-latency-level"] = String(level);
				attrs["data-latency-ms"] = latency.ms === null || latency.ms === void 0 ? "" : String(latency.ms);
			}
			const reading = latency.state === "done" && latency.ms !== null && latency.ms !== void 0;
			const text = latency.state === "measuring" ? t("latencyMeasuring") : latency.state === "failed" ? "—" : latency.state === "done" ? reading ? `${latency.ms} ms` : t("latencyTimeout") : "";
			const title = latency.state === "done" ? reading ? t("latencyTitle", { ms: latency.ms ?? 0 }) : t("latencyTitleTimeout") : void 0;
			return (0, react.createElement)("span", {
				...attrs,
				...title ? { title } : {}
			}, reading ? (0, react.createElement)("span", {
				className: "dmg-bars",
				"aria-hidden": true,
				"data-level": String(level)
			}, ...[
				0,
				1,
				2,
				3
			].map((index) => (0, react.createElement)("i", {
				key: index,
				"data-on": index < level ? "true" : "false"
			}))) : null, (0, react.createElement)("span", { className: "dmg-latency-text" }, text));
		}
		function LineCard({ draft, index, total, saving, active, expanded, latency, checking, checkDisabled, check, checkError, diff, lastSyncAt, onToggle, onChange, onMove, onRemove, onCheck, onClearCheck }) {
			const diffParts = diff ? [diff.added.length ? (0, react.createElement)("p", {
				key: "added",
				className: "dmg-hint"
			}, t("diffAdded", { list: diff.added.join(t("listSeparator")) })) : null, diff.removed.length ? (0, react.createElement)("p", {
				key: "removed",
				className: "dmg-hint"
			}, t("diffRemoved", { list: diff.removed.join(t("listSeparator")) })) : null].filter(Boolean) : [];
			const lineLabel = String(index + 1);
			const bodyId = `dmg-line-body-${draft.draftId}`;
			return (0, react.createElement)("div", {
				className: "dmg-line",
				"data-line-id": draft.id,
				"data-draft": draft.id ? void 0 : "",
				"data-expanded": expanded ? "true" : "false"
			}, (0, react.createElement)("div", { className: "dmg-line-head" }, (0, react.createElement)("button", {
				type: "button",
				className: "dmg-line-toggle",
				"aria-expanded": expanded,
				...expanded ? { "aria-controls": bodyId } : {},
				"data-toggle": "",
				onClick: onToggle
			}, (0, react.createElement)("span", {
				className: "dmg-chevron",
				"aria-hidden": true
			}, (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.IconTriangleRightFillRegular, null)), (0, react.createElement)("span", { className: "dmg-line-index" }, t("lineIndex", { n: lineLabel })), active ? (0, react.createElement)("span", {
				className: "dmg-active",
				role: "img",
				"aria-label": t("currentLine"),
				title: t("currentLine"),
				"data-active-line": draft.id
			}) : null, draft.id && !draft.complete ? (0, react.createElement)("span", {
				className: "dmg-unset",
				"data-line-incomplete": ""
			}, t("unconfigured")) : null, (0, react.createElement)("span", { className: "dmg-line-title" }, `${hostnameOf(draft.baseUrl)}${draft.id ? "" : t("unsaved")}`), (0, react.createElement)(LatencySlot, { latency })), (0, react.createElement)("div", { className: "dmg-line-actions" }, iconButton(t("moveUp"), (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.IconChevronUpOutlineRegular, null), lineLabel, saving || index === 0, () => onMove(-1), t("firstLine")), iconButton(t("moveDown"), (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutlineRegular, null), lineLabel, saving || index === total - 1, () => onMove(1), t("lastLine")), iconButton(t("remove"), (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutlineRegular, null), lineLabel, saving || total <= 1, onRemove, t("onlyLine")))), expanded ? (0, react.createElement)("div", {
				className: "dmg-line-body",
				id: bodyId
			}, (0, react.createElement)("label", { className: "dmg-field" }, (0, react.createElement)("span", null, t("baseUrlLabel")), (0, react.createElement)("input", {
				className: "dmg-input",
				value: draft.baseUrl,
				disabled: saving,
				placeholder: "http://127.0.0.1:3425/v1",
				onChange: (e) => onChange({ baseUrl: e.target.value })
			})), (0, react.createElement)("label", { className: "dmg-field" }, (0, react.createElement)("span", null, t("apiKeyLabel", { state: `${draft.keyConfigured ? t("configured") : t("notConfigured")}${draft.keyWritable ? "" : t("readonlyFromEnv")}` })), (0, react.createElement)("input", {
				className: "dmg-input",
				type: "password",
				autoComplete: "off",
				value: draft.apiKey,
				disabled: saving || !draft.keyWritable,
				placeholder: draft.keyConfigured ? t("keepBlank") : t("required"),
				onChange: (e) => onChange({ apiKey: e.target.value })
			})), (0, react.createElement)("div", {
				className: "dmg-check",
				"data-check": ""
			}, (0, react.createElement)("div", { className: "dmg-row" }, (0, react.createElement)("button", {
				type: "button",
				className: "dmg-button",
				"data-check-run": "",
				disabled: saving || checkDisabled || draft.baseUrl.trim() === "",
				onClick: onCheck
			}, checking ? t("checking") : t("checkLine")), check ? (0, react.createElement)("button", {
				type: "button",
				className: "dmg-button",
				disabled: saving || checking,
				onClick: onClearCheck
			}, t("clear")) : null), (0, react.createElement)("p", { className: "dmg-hint" }, t("checkReadonly")), checkError ? (0, react.createElement)("p", { className: "dmg-error" }, checkError) : null, check ? (0, react.createElement)("p", {
				className: "dmg-check-line",
				"data-check-kind": check.kind
			}, describeCheck(check, diff, lastSyncAt)) : null, check?.reason ? (0, react.createElement)("p", {
				className: "dmg-hint",
				"data-check-reason": ""
			}, check.reason) : null, check?.models?.length ? (0, react.createElement)("details", { className: "dmg-check-models" }, (0, react.createElement)("summary", null, t("modelIds", { n: check.models.length })), ...diffParts, (0, react.createElement)("p", { className: "dmg-hint" }, check.models.map((model) => model.id).join("、"))) : null), (0, react.createElement)("details", {
				className: "dmg-advanced",
				open: true,
				"data-advanced": ""
			}, (0, react.createElement)("summary", null, t("advanced")), (0, react.createElement)("div", { className: "dmg-advanced-body" }, (0, react.createElement)("label", { className: "dmg-field" }, (0, react.createElement)("span", null, `${t("accessMode")}${draft.accessWritable ? "" : t("accessReadonly")}`), (0, react.createElement)("select", {
				className: "dmg-select",
				"aria-label": t("accessMode"),
				value: draft.accessMode,
				disabled: saving || !draft.accessWritable,
				onChange: (e) => onChange({ accessMode: e.target.value })
			}, ...ACCESS_MODES.map((mode) => (0, react.createElement)("option", {
				key: mode.id,
				value: mode.id
			}, t(mode.labelKey))))), draft.accessMode === "direct" ? (0, react.createElement)("p", { className: "dmg-hint" }, draft.savedAccess ? t("directHintClears") : t("directHint")) : (0, react.createElement)("p", { className: "dmg-hint" }, t("cloudflareHint")), ...draft.accessMode === "cloudflare" ? [[
				"Access Client ID",
				draft.accessClientId,
				"accessClientId"
			], [
				"Access Client Secret",
				draft.accessClientSecret,
				"accessClientSecret"
			]].map(([label, value, field]) => (0, react.createElement)("label", {
				key: label,
				className: "dmg-field"
			}, (0, react.createElement)("span", null, t("accessFieldLabel", {
				field: label,
				state: `${draft.accessConfigured ? t("configured") : t("notConfigured")}${draft.accessWritable ? "" : t("readonlyFromEnv")}`
			})), (0, react.createElement)("input", {
				className: "dmg-input",
				type: "password",
				autoComplete: "off",
				value,
				disabled: saving || !draft.accessWritable,
				placeholder: t("keepBlank"),
				onChange: (e) => onChange({ [field]: e.target.value })
			}))) : []))) : null);
		}
		function SyncStatus({ settings }) {
			const count = (settings.groups ?? []).reduce((n, g) => n + g.models.length, 0);
			const rejected = settings.rejectedOwners ?? [];
			const registration = settings.routeRegistrationError;
			return (0, react.createElement)("div", {
				className: "dmg-meta",
				"data-sync": ""
			}, settings.lastSyncAt ? (0, react.createElement)("p", null, t("modelsCount", { n: count }), (0, react.createElement)("time", { dateTime: settings.lastSyncAt }, formatTime(settings.lastSyncAt))) : null, settings.lastSyncError ? (0, react.createElement)("p", { className: "dmg-error" }, t("syncFailed", {
				kind: settings.lastSyncErrorKind ? t("syncFailedKind", { kind: t(SYNC_KIND[settings.lastSyncErrorKind] ?? "syncKindHttp") }) : "",
				error: settings.lastSyncError
			})) : null, registration ? (0, react.createElement)("p", {
				className: "dmg-error",
				role: "alert"
			}, t("routeRegistrationFailed", {
				code: registration.code,
				route: registration.route ? `, ${registration.route}` : ""
			})) : null, settings.knownOwnersReset ? (0, react.createElement)("p", { className: "dmg-hint" }, t("ownersReset")) : null, settings.ownerLimitReached ? (0, react.createElement)("p", { className: "dmg-hint" }, t("ownerLimitReached", { list: rejected.join(t("listSeparator")) })) : null);
		}
		function ProviderGroup({ provider, group, settings, cards, busy, saving, mutateSettings, onRefresh, onReset, resetBusyKey, resetStatuses, notice, alert }) {
			const [error, setError] = (0, react.useState)("");
			const saved = settings?.visibleModels ?? {};
			const following = !Object.hasOwn(saved, provider);
			const models = group?.models ?? [];
			const post = async (body) => {
				setError("");
				const result = await mutateSettings(body);
				if (result?.error) setError(result.error);
			};
			const setVisible = (model, visible) => {
				post((view) => {
					const saved = view.visibleModels ?? {};
					const models = view.groups?.find((g) => g.provider === provider)?.models ?? [];
					const current = Object.hasOwn(saved, provider) ? saved[provider] : models.map((m) => m.id);
					const next = visible ? [.../* @__PURE__ */ new Set([...current, model.id])] : current.filter((id) => id !== model.id);
					return { visibleModels: {
						...saved,
						[provider]: next
					} };
				});
			};
			const follow = () => {
				post((view) => {
					const rest = { ...view.visibleModels };
					delete rest[provider];
					return { visibleModels: rest };
				});
			};
			const routing = provider === ROUTING_PROVIDER;
			const title = routing ? t("routingGroupsTitle") : provider;
			return (0, react.createElement)("section", {
				className: "dmg-panel",
				"data-provider": provider,
				"aria-label": title
			}, (0, react.createElement)("div", { className: "dmg-head" }, (0, react.createElement)("h3", null, title), group && !following ? (0, react.createElement)("button", {
				type: "button",
				className: "dmg-button",
				disabled: saving,
				onClick: follow
			}, t("followCatalog")) : null), routing ? (0, react.createElement)("p", { className: "dmg-hint" }, t("routingGroupsHint")) : null, group ? (0, react.createElement)("p", { className: "dmg-hint" }, following ? t("visibilityFollow") : t("visibilityManual")) : null, models.length ? (0, react.createElement)("div", { className: "dmg-models" }, ...models.map((model) => (0, react.createElement)(ModelLine, {
				key: model.id,
				model,
				disabled: saving,
				visible: model.visible ?? (following || (saved[provider] ?? []).includes(model.id)),
				effort: settings?.defaultEfforts?.[model.id],
				onVisible: (visible) => setVisible(model, visible),
				onEffort: (effort) => {
					post({ defaultEffort: {
						model: model.id,
						effort
					} });
				}
			}))) : null, cards.length ? (0, react.createElement)("div", { className: "dmg-cards" }, ...cards.map((card) => (0, react.createElement)(UsageCard, {
				key: cardKey$1(card),
				card,
				busy,
				disabled: saving,
				resetBusy: resetBusyKey === cardKey$1(card),
				...resetStatuses?.[cardKey$1(card)] === void 0 ? {} : { resetStatus: resetStatuses[cardKey$1(card)] },
				onRefresh: () => onRefresh(card),
				onReset: () => onReset(card)
			}))) : null, notice === "not-reread" ? (0, react.createElement)("p", {
				className: "dmg-hint",
				role: "status"
			}, t("notReread")) : null, alert ? (0, react.createElement)("p", {
				className: "dmg-error",
				role: "alert",
				"data-usage-alert": ""
			}, alert) : null, error ? (0, react.createElement)("p", {
				className: "dmg-error",
				role: "alert"
			}, error) : null);
		}
		function ModelLine({ model, visible, effort, disabled, onVisible, onEffort }) {
			const efforts = model.efforts ?? [];
			const stale = effort !== void 0 && !efforts.includes(effort);
			const label = model.name || model.id;
			return (0, react.createElement)("div", {
				className: "dmg-model",
				"data-model": model.id
			}, (0, react.createElement)("label", null, (0, react.createElement)("input", {
				type: "checkbox",
				checked: visible,
				disabled,
				"aria-label": t("showInPicker", { label }),
				onChange: (e) => onVisible(e.target.checked)
			}), (0, react.createElement)("span", null, label), model.name && model.name !== model.id ? (0, react.createElement)("code", null, model.id) : null, model.routingKind ? (0, react.createElement)("span", {
				className: "dmg-hint",
				"data-routing-kind": model.routingKind
			}, t(model.routingKind === "auto" ? "routingKindAuto" : "routingKindCustom")) : null), efforts.length ? (0, react.createElement)("select", {
				className: "dmg-select",
				"aria-label": t("defaultEffortAria", { label }),
				disabled,
				value: effort ?? "",
				onChange: (e) => onEffort(e.target.value === "" ? null : e.target.value)
			}, (0, react.createElement)("option", { value: "" }, t("defaultEffortNone")), stale ? (0, react.createElement)("option", {
				value: effort,
				disabled: true
			}, t("effortStale", { effort })) : null, ...efforts.map((id) => (0, react.createElement)("option", {
				key: id,
				value: id
			}, id))) : null);
		}
		/** Copy for one checkbox in the window selection. */
		const windowKindLabel = (kind) => kind === "fiveHour" ? t("sidebarWindowFiveHour") : kind === "weekly" ? t("sidebarWindowWeekly") : t("sidebarWindowMonthly");
		/**
		* The sidebar preference: one host-persisted flag. The host is the source of
		* truth; the module store is updated so the already-mounted sidebar card
		* follows the toggle without a reload.
		*/
		function SidebarUsagePreference({ settings, saving, mutateSettings }) {
			const [failed, setFailed] = (0, react.useState)("");
			const enabled = settings.sidebarUsage === true;
			const savedMinutes = settings.sidebarRefreshMinutes ?? 5;
			const savedWindows = normalizeSidebarWindows(settings.sidebarWindows) ?? [...DEFAULT_SIDEBAR_WINDOWS];
			const [draft, setDraft] = (0, react.useState)(String(savedMinutes));
			(0, react.useEffect)(() => {
				setDraft(String(savedMinutes));
			}, [savedMinutes]);
			const toggle = async () => {
				setFailed("");
				const next = !enabled;
				const result = await mutateSettings({ sidebarUsage: next });
				if (result?.error) {
					setFailed(result.error);
					return;
				}
				setSidebarPreference({ usage: result?.view === void 0 ? next : result.view.sidebarUsage === true });
			};
			const toggleKind = async (kind, checked) => {
				setFailed("");
				const next = SIDEBAR_WINDOW_KINDS.filter((candidate) => candidate === kind ? checked : savedWindows.includes(candidate));
				if (next.length === 0) {
					setFailed(t("sidebarWindowAtLeastOne"));
					return;
				}
				if (next.join() === savedWindows.join()) return;
				const result = await mutateSettings({ sidebarWindows: next });
				if (result?.error) {
					setFailed(result.error);
					return;
				}
				setSidebarPreference({ windows: normalizeSidebarWindows(result?.view?.sidebarWindows) ?? next });
			};
			const commitMinutes = async () => {
				setFailed("");
				const raw = draft.trim();
				if (!/^\d+$/.test(raw)) {
					setDraft(String(savedMinutes));
					return;
				}
				const minutes = Math.min(MAX_REFRESH_MINUTES, Number(raw));
				if (minutes !== savedMinutes) {
					const result = await mutateSettings({ sidebarRefreshMinutes: minutes });
					if (result?.error) {
						setFailed(result.error);
						setDraft(String(savedMinutes));
						return;
					}
					setSidebarPreference({ refreshMinutes: result?.view === void 0 ? minutes : result.view.sidebarRefreshMinutes ?? minutes });
				}
				setDraft(String(minutes));
			};
			return (0, react.createElement)("section", {
				className: "dmg-panel",
				"data-sidebar-usage": ""
			}, (0, react.createElement)("h3", null, t("sidebarPanelTitle")), (0, react.createElement)("p", { className: "dmg-hint" }, t("sidebarToggleHint")), (0, react.createElement)("div", { className: "dmg-switch-row" }, (0, react.createElement)("span", null, t("sidebarToggle")), (0, react.createElement)("button", {
				type: "button",
				className: "dmg-switch",
				role: "switch",
				disabled: saving,
				"aria-checked": enabled,
				"aria-label": t("sidebarToggle"),
				"data-sidebar-usage-switch": "",
				onClick: () => {
					toggle();
				}
			}, (0, react.createElement)("i", null))), (0, react.createElement)("div", {
				className: "dmg-field",
				"data-sidebar-windows": ""
			}, (0, react.createElement)("span", null, t("sidebarWindowLabel")), (0, react.createElement)("div", { className: "dmg-check-list" }, ...SIDEBAR_WINDOW_KINDS.map((kind) => (0, react.createElement)("label", {
				className: "dmg-check-row",
				key: kind
			}, (0, react.createElement)("input", {
				type: "checkbox",
				"data-sidebar-window": kind,
				checked: savedWindows.includes(kind),
				disabled: saving,
				onChange: (event) => {
					toggleKind(kind, event.target.checked);
				}
			}), (0, react.createElement)("span", null, windowKindLabel(kind)))))), (0, react.createElement)("p", { className: "dmg-hint" }, t("sidebarWindowsHint")), (0, react.createElement)("div", { className: "dmg-refresh-row" }, (0, react.createElement)("span", null, t("sidebarRefreshLabel")), (0, react.createElement)("span", { className: "dmg-refresh-control" }, (0, react.createElement)("input", {
				type: "number",
				className: "dmg-refresh-input",
				min: 0,
				max: MAX_REFRESH_MINUTES,
				step: 1,
				value: draft,
				disabled: saving,
				"data-sidebar-refresh": "",
				"aria-label": t("sidebarRefreshLabel"),
				onChange: (event) => setDraft(event.target.value),
				onBlur: () => {
					commitMinutes();
				},
				onKeyDown: (event) => {
					if (event.key === "Enter") event.currentTarget.blur();
				}
			}), (0, react.createElement)("span", { className: "dmg-refresh-unit" }, t("sidebarRefreshUnit")))), (0, react.createElement)("p", { className: "dmg-hint" }, t("sidebarRefreshHint")), failed ? (0, react.createElement)("p", {
				className: "dmg-error",
				role: "alert"
			}, failed) : null);
		}
		let cache;
		let inflight;
		/** Read the cards, reusing a read younger than {@link SIDEBAR_TTL_MS} unless forced. */
		async function loadCards(api, options = {}) {
			const now = options.now ?? Date.now;
			if (options.force !== true && cache !== void 0 && now() - cache.at < 6e4) return cache.view;
			if (inflight !== void 0) return inflight;
			const request = (async () => {
				const response = await api({
					method: "GET",
					path: "cards"
				});
				const view = parseCards(response.body, response.status);
				if (isOk(response)) cache = {
					at: now(),
					view
				};
				return view;
			})();
			inflight = request;
			try {
				return await request;
			} finally {
				if (inflight === request) inflight = void 0;
			}
		}
		/** Full refresh (`{all:true}`); a failure keeps the previous cache untouched. */
		async function refreshCards(api, options = {}) {
			const now = options.now ?? Date.now;
			const response = await api({
				method: "POST",
				path: "cards",
				body: { all: true }
			});
			const view = parseCards(response.body, response.status);
			if (!isOk(response)) {
				if (view.status === "forbidden" || view.status === "unconfigured") {
					cache = {
						at: now(),
						view
					};
					return {
						ok: true,
						view,
						status: response.status
					};
				}
				const reason = response.body?.error;
				return {
					ok: false,
					status: response.status,
					error: typeof reason === "string" && reason !== "" ? reason : `HTTP ${response.status}`
				};
			}
			cache = {
				at: now(),
				view
			};
			return {
				ok: true,
				view,
				status: response.status
			};
		}
		// src/client/sidebar-view.ts
		/** Which gateway window names answer each selectable kind. */
		const WINDOW_PATTERNS = {
			fiveHour: /(?:^|[^0-9])5[\s-]*(?:hours?|hrs?|h)\b|five[\s-]*hours?|5\s*小时|五小时/i,
			weekly: /7\s*days?|week|weekly|周/i,
			monthly: /month|30\s*days?|月/i
		};
		const usedLevel = (used) => used >= 90 ? "high" : used > 70 ? "warn" : "normal";
		const numericWindows = (card) => (card.windows ?? []).filter((window) => typeof window.used === "number" && Number.isFinite(window.used));
		/** The reading shows text (`unlimited`, a gateway `display`), not the `used` percentage: no bar, no colour, not a fallback candidate. */
		const textReading = (window) => window.unlimited === true || typeof window.display === "string" && window.display !== "";
		const tightest = (windows) => windows.reduce((best, window) => window.used > best.used ? window : best);
		const named = (windows, pattern) => windows.filter((window) => typeof window.name === "string" && pattern.test(window.name));
		const windowRow = (window, kind, fallback = false) => ({
			window,
			kind,
			...typeof window.used === "number" && Number.isFinite(window.used) && !textReading(window) ? { used: Math.min(100, Math.max(0, window.used)) } : {},
			...typeof window.display === "string" && window.display !== "" ? { display: window.display } : {},
			...window.unlimited === true ? { unlimited: true } : {},
			...fallback ? { fallback: true } : {}
		});
		/**
		* Blocks in gateway order (the product decision: no current-first, no severity
		* sort). Each block lists one line for every configured kind the upstream really
		* reports, `fiveHour` before `weekly`; when it reports none of them the block
		* falls back to its highest numeric window, then to a `display`/unlimited one,
		* and a balance-only account keeps its balance. Nothing is invented.
		*/
		function sidebarRows(cards, kinds = DEFAULT_SIDEBAR_WINDOWS) {
			return cards.map((card) => {
				const failed = typeof card.error === "string" && card.error !== "";
				const numeric = failed ? [] : numericWindows(card);
				const windows = [];
				if (!failed) {
					for (const kind of SIDEBAR_WINDOW_KINDS) {
						if (!kinds.includes(kind)) continue;
						const matches = named(numeric, WINDOW_PATTERNS[kind]).filter((window) => !windows.some((row) => row.window === window));
						if (matches.length > 0) windows.push(windowRow(tightest(matches), kind));
					}
					if (windows.length === 0) {
						const percent = numeric.filter((window) => !textReading(window));
						const best = percent.length > 0 ? tightest(percent) : (card.windows ?? []).find((window) => window.unlimited === true || typeof window.display === "string" && window.display !== "");
						if (best !== void 0) windows.push(windowRow(best, "other", true));
					}
				}
				const balance = card.balance === void 0 || card.balance === null || card.balance === "" ? void 0 : String(card.balance);
				return {
					card,
					windows,
					...balance === void 0 ? {} : { balance },
					failed
				};
			});
		}
		/** `8` → `8%`, `70.5` → `70.5%` (same rounding as the settings page). */
		const formatUsed = (used) => `${Math.round(used * 10) / 10}%`;
		/** Whole minutes since a gateway read timestamp; undefined when unparseable. */
		function ageMinutes(readAt, now) {
			if (readAt === void 0 || readAt === "") return void 0;
			const time = Date.parse(readAt);
			if (Number.isNaN(time)) return void 0;
			return Math.max(0, Math.floor((now - time) / 6e4));
		}
		const pad = (value) => String(value).padStart(2, "0");
		/**
		* Compact reset label for the 220px expanded card: `19:20` when it is today,
		* `11/10 11:00` within the year, otherwise the full date. The full timestamp is
		* always available in `title` and on the settings page.
		*/
		function formatResetShort(resetsAt, now) {
			if (resetsAt === void 0 || resetsAt === "") return void 0;
			const time = Date.parse(resetsAt);
			if (Number.isNaN(time)) return void 0;
			const reset = new Date(time);
			const today = new Date(now);
			const clock = `${pad(reset.getHours())}:${pad(reset.getMinutes())}`;
			if (reset.getFullYear() !== today.getFullYear()) return `${reset.getFullYear()}/${reset.getMonth() + 1}/${reset.getDate()} ${clock}`;
			if (reset.getMonth() !== today.getMonth() || reset.getDate() !== today.getDate()) return `${reset.getMonth() + 1}/${reset.getDate()} ${clock}`;
			return clock;
		}
		/**
		* Reset label for one compact sidebar row: always a date and a clock
		* (`11/10 11:00`, `2027/1/2 09:05` when it is another year). The compact row
		* keeps the date even for a reset later today on purpose: the gateway's window
		* name (`7 days`) says nothing about when the quota comes back, and the row has
		* no other place to put it.
		*/
		function formatResetDeadline(resetsAt, now) {
			if (resetsAt === void 0 || resetsAt === "") return void 0;
			const time = Date.parse(resetsAt);
			if (Number.isNaN(time)) return void 0;
			const reset = new Date(time);
			const clock = `${pad(reset.getHours())}:${pad(reset.getMinutes())}`;
			const day = `${reset.getMonth() + 1}/${reset.getDate()} ${clock}`;
			return reset.getFullYear() === new Date(now).getFullYear() ? day : `${reset.getFullYear()}/${day}`;
		}
		/** Stable identity of one card across reads: provider + account. */
		const cardIdentity = (card) => `${card.provider}\u0000${card.user ?? ""}`;
		const cardReadTime = (card) => card.readAt ?? card.asOf;
		/**
		* Did a full refresh leave every card's read time untouched? Same rule the
		* settings page uses for "Magpie did not re-read (throttled)".
		*/
		function unchangedReads(previous, next) {
			if (previous.length === 0 || next.length !== previous.length) return false;
			const before = new Map(previous.map((card) => [cardIdentity(card), cardReadTime(card)]));
			return next.every((card) => before.has(cardIdentity(card)) && before.get(cardIdentity(card)) === cardReadTime(card));
		}
		/** Group same-provider cards at the provider's first appearance; a one-card group renders as before. */
		function sidebarGroups(cards) {
			const groups = [];
			cards.forEach((card, index) => {
				const group = groups.find((g) => g.provider === card.provider);
				if (group) group.indexes.push(index);
				else groups.push({
					provider: card.provider,
					indexes: [index]
				});
			});
			return groups;
		}
		/** The account's own name inside a multi-account group, or undefined so the caller numbers it. */
		const accountUser = (card) => typeof card.user === "string" && card.user.trim() !== "" ? card.user : void 0;
		// src/client/SidebarUsage.ts
		const RAIL_POPOVER_WIDTH = 320;
		function SidebarUsage({ api, wide = true }) {
			const [preference, setPreference] = (0, react.useState)(() => readSidebarPreference());
			const [view, setView] = (0, react.useState)(void 0);
			const [open, setOpen] = (0, react.useState)(false);
			const [busy, setBusy] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)("");
			const [notice, setNotice] = (0, react.useState)("");
			const anchorRef = (0, react.useRef)(null);
			const bodyRef = (0, react.useRef)(null);
			(0, react.useLayoutEffect)(() => {
				ensureStyles();
			});
			const [bodyOverflow, setBodyOverflow] = (0, react.useState)(false);
			const [bodyMore, setBodyMore] = (0, react.useState)(false);
			const [detailOverflow, setDetailOverflow] = (0, react.useState)(false);
			const [detailMore, setDetailMore] = (0, react.useState)(false);
			const detailRef = (0, react.useRef)(null);
			const panelRef = (0, react.useRef)(null);
			const viewRef = (0, react.useRef)(void 0);
			viewRef.current = view;
			(0, react.useEffect)(() => {
				const unsubscribe = subscribeSidebarPreference((value) => setPreference(value));
				hydrateSidebarPreference(api).then(() => setPreference(readSidebarPreference()));
				return unsubscribe;
			}, [api]);
			const enabled = preference?.usage;
			const refreshMinutes = preference?.refreshMinutes ?? 5;
			const windows = preference?.windows ?? [...DEFAULT_SIDEBAR_WINDOWS];
			(0, react.useEffect)(() => {
				if (enabled !== true || api === void 0) return;
				let alive = true;
				loadCards(api).then((next) => {
					if (alive) setView(next);
				}, (reason) => {
					if (alive) setError(errorText(reason));
				});
				return () => {
					alive = false;
				};
			}, [enabled, api]);
			(0, react.useLayoutEffect)(() => {
				const sync = () => {
					const body = bodyRef.current;
					setBodyOverflow(overflows(body));
					setBodyMore(belowFold(body));
					const detail = detailRef.current;
					setDetailOverflow(overflows(detail));
					setDetailMore(belowFold(detail));
				};
				sync();
				if (typeof ResizeObserver === "undefined") return;
				const observer = new ResizeObserver(sync);
				for (const element of [bodyRef.current, detailRef.current]) if (element !== null) observer.observe(element);
				for (const element of Array.from(bodyRef.current?.children ?? [])) if (element instanceof HTMLElement) observer.observe(element);
				return () => observer.disconnect();
			}, [
				enabled,
				open,
				view
			]);
			(0, react.useEffect)(() => {
				if (enabled !== true || api === void 0) return;
				const onVisibilityChange = () => {
					if (document.visibilityState !== "visible") return;
					loadCards(api).then(setView, () => {});
				};
				document.addEventListener("visibilitychange", onVisibilityChange);
				return () => document.removeEventListener("visibilitychange", onVisibilityChange);
			}, [enabled, api]);
			(0, react.useEffect)(() => {
				if (enabled !== true || api === void 0 || refreshMinutes <= 0) return;
				let timer;
				let stopped = false;
				const interval = refreshMinutes * 6e4;
				const refreshNow = () => {
					refreshCards(api).then((result) => {
						if (result.ok) setView(result.view);
					}, () => {});
				};
				const schedule = () => {
					timer = setTimeout(() => {
						if (stopped) return;
						if (document.visibilityState === "visible") refreshNow();
						schedule();
					}, interval);
				};
				schedule();
				return () => {
					stopped = true;
					if (timer !== void 0) clearTimeout(timer);
				};
			}, [
				enabled,
				api,
				refreshMinutes
			]);
			const railOpen = open && !wide;
			const pos = useRailPosition(railOpen, anchorRef, panelRef);
			(0, _deepseek_ai_dsh_client_ui_primitives.useDismissOnOutsidePointer)(anchorRef, railOpen, setOpen, panelRef);
			(0, react.useEffect)(() => {
				if (!open) return;
				const onKeyDown = (event) => {
					if (event.key === "Escape") setOpen(false);
				};
				document.addEventListener("keydown", onKeyDown);
				return () => document.removeEventListener("keydown", onKeyDown);
			}, [open]);
			const refresh = async () => {
				if (api === void 0 || busy) return;
				setBusy(true);
				setError("");
				setNotice("");
				try {
					const result = await refreshCards(api);
					if (!result.ok) {
						setError(result.error);
						return;
					}
					const previous = viewRef.current?.cards ?? [];
					setView(result.view);
					setNotice(unchangedReads(previous, result.view.cards) ? t("notReread") : "");
				} catch (reason) {
					setError(errorText(reason));
				} finally {
					setBusy(false);
				}
			};
			const expand = () => {
				setOpen(true);
				if (api === void 0) return;
				loadCards(api).then(setView, () => {});
			};
			const collapse = () => {
				setOpen(false);
				setNotice("");
			};
			const toggle = () => {
				if (open) collapse();
				else expand();
			};
			if (enabled !== true) return null;
			const now = Date.now();
			const cards = view?.cards ?? [];
			const rows = sidebarRows(cards, windows);
			const latest = cards.map(cardReadTime).filter((value) => typeof value === "string").sort().at(-1);
			const status = statusText(view, error);
			const head = () => (0, react.createElement)("div", {
				className: "dmg-sidebar-head",
				onClick: toggle
			}, (0, react.createElement)("span", {
				className: "dmg-sidebar-bird",
				"aria-hidden": true
			}), (0, react.createElement)("span", { className: "dmg-sidebar-title" }, t("sidebarTitle")), latest === void 0 ? null : (0, react.createElement)("span", { className: "dmg-sidebar-fresh" }, ageText(latest, now)), refreshButton(refresh, busy), (0, react.createElement)("button", {
				type: "button",
				className: "dmg-sidebar-icon",
				"data-dmg-sidebar-toggle": "",
				"aria-label": open ? t("sidebarCollapse") : t("sidebarExpand"),
				"aria-expanded": open,
				title: open ? t("sidebarCollapse") : t("sidebarExpand")
			}, chevron(open)));
			if (!wide) return (0, react.createElement)(react.Fragment, null, (0, react.createElement)("button", {
				type: "button",
				className: "dmg-sidebar-rail is-button",
				"data-dmg-sidebar-rail": "",
				ref: (node) => {
					anchorRef.current = node;
				},
				title: t("sidebarTitle"),
				"aria-label": t("sidebarTitle"),
				"aria-haspopup": "dialog",
				"aria-expanded": open,
				onClick: () => {
					if (open) setOpen(false);
					else expand();
				}
			}, (0, react.createElement)("span", {
				className: "dmg-sidebar-bird",
				"aria-hidden": true
			})), open ? (0, react_dom.createPortal)((0, react.createElement)("div", {
				ref: panelRef,
				className: "dmg-sidebar-popover",
				role: "dialog",
				"aria-label": t("sidebarTitle"),
				"data-dmg-sidebar-popover": "",
				style: {
					...pos ?? {
						visibility: "hidden",
						left: 0,
						top: 0
					},
					width: RAIL_POPOVER_WIDTH
				}
			}, head(), (0, react.createElement)("div", {
				className: "dmg-sidebar-rule",
				"aria-hidden": true
			}), notice !== "" ? (0, react.createElement)("p", {
				className: "dmg-sidebar-status",
				role: "status"
			}, notice) : null, detail(cards, now, status)), document.body) : null);
			return (0, react.createElement)("div", {
				className: "dmg-sidebar",
				"data-dmg-sidebar": "",
				"data-open": open
			}, (0, react.createElement)("div", { className: "dmg-sidebar-card" }, head(), open ? (0, react.createElement)(react.Fragment, null, notice !== "" ? (0, react.createElement)("p", {
				className: "dmg-sidebar-status",
				role: "status"
			}, notice) : null, (0, react.createElement)("div", {
				className: "dmg-sidebar-detail",
				"data-dmg-sidebar-expanded": "",
				ref: (node) => {
					detailRef.current = node;
				},
				onScroll: () => {
					setDetailOverflow(overflows(detailRef.current));
					setDetailMore(belowFold(detailRef.current));
				}
			}, detail(cards, now, status)), detailOverflow ? (0, react.createElement)("div", {
				className: `dmg-sidebar-more${detailMore ? "" : " is-hidden"}`,
				"aria-hidden": true,
				"data-dmg-sidebar-more": ""
			}, doubleChevron()) : null) : (0, react.createElement)(react.Fragment, null, (0, react.createElement)("div", {
				className: `dmg-sidebar-body${bodyMore ? " is-scroll" : ""}`,
				ref: (node) => {
					bodyRef.current = node;
				},
				onScroll: () => {
					setBodyOverflow(overflows(bodyRef.current));
					setBodyMore(belowFold(bodyRef.current));
				}
			}, status !== void 0 ? (0, react.createElement)("p", {
				className: "dmg-sidebar-status",
				role: "status"
			}, status) : compactGroups(cards, rows, now)), bodyOverflow ? (0, react.createElement)("div", {
				className: `dmg-sidebar-more${bodyMore ? "" : " is-hidden"}`,
				"aria-hidden": true,
				"data-dmg-sidebar-more": ""
			}, doubleChevron()) : null)));
		}
		/**
		* One upstream block. A single window keeps the dense one-line row
		* (`Claude (7 days) · 11/20 11:00 · 20%`); several configured windows become a
		* name heading with one line per window, each with its own bar. A failed card
		* and a balance-only card stay single-line.
		*/
		function compactRow(row, now, key, account, sharedWindow = false) {
			const attrs = {
				className: "dmg-sidebar-row",
				"data-dmg-sidebar-row": row.card.provider,
				key
			};
			const name = account === void 0 ? (0, react.createElement)("span", { className: "dmg-sidebar-name" }, row.card.name ?? row.card.provider) : accountName(account);
			if (row.failed) return (0, react.createElement)("div", attrs, (0, react.createElement)("div", { className: "dmg-sidebar-row-line" }, (0, react.createElement)("span", { className: "dmg-sidebar-label" }, name), (0, react.createElement)("span", {
				className: "dmg-sidebar-pct",
				"data-reading": ""
			}, t("usageReadingFailed"))));
			if (row.windows.length === 0) return (0, react.createElement)("div", attrs, (0, react.createElement)("div", { className: "dmg-sidebar-row-line" }, (0, react.createElement)("span", { className: "dmg-sidebar-label" }, name), (0, react.createElement)("span", {
				className: "dmg-sidebar-pct",
				"data-reading": "",
				"data-balance": "",
				...row.balance === void 0 ? {} : { title: `${t("usageBalance")} ${row.balance}` }
			}, row.balance ?? "—")));
			if (row.windows.length === 1 && account !== void 0) {
				const only = row.windows[0];
				return (0, react.createElement)("div", attrs, (0, react.createElement)("div", { className: "dmg-sidebar-account-line" }, name), (0, react.createElement)("div", { className: "dmg-sidebar-row-line" }, (0, react.createElement)("span", { className: "dmg-sidebar-label" }, sharedWindow ? null : windowLabel(only, false)), expiry(only.window, now), reading(only)), bar(only));
			}
			if (row.windows.length === 1) {
				const only = row.windows[0];
				return (0, react.createElement)("div", attrs, (0, react.createElement)("div", { className: "dmg-sidebar-row-line" }, (0, react.createElement)("span", { className: "dmg-sidebar-label" }, name, sharedWindow ? null : windowLabel(only, true)), expiry(only.window, now), reading(only)), bar(only));
			}
			return (0, react.createElement)("div", {
				...attrs,
				className: "dmg-sidebar-row is-multi",
				"data-dmg-sidebar-multi": ""
			}, (0, react.createElement)("div", { className: "dmg-sidebar-group-name" }, account === void 0 ? row.card.name ?? row.card.provider : accountName(account)), ...row.windows.map((window, index) => (0, react.createElement)(react.Fragment, { key: index }, (0, react.createElement)("div", {
				className: "dmg-sidebar-win-row",
				"data-dmg-sidebar-tier": window.kind
			}, (0, react.createElement)("span", {
				className: "dmg-sidebar-win-label",
				...windowTitle(window)
			}, window.window.name ?? "—"), expiry(window.window, now), reading(window)), bar(window))));
		}
		/** `user`, else its position in the group (`账号 2`); the plan rides along. */
		const accountOf = (card, position) => ({
			label: accountUser(card) ?? t("sidebarAccountN", { n: position }),
			...card.plan === void 0 ? {} : { plan: card.plan }
		});
		/** Only the account label shrinks; plan and the rest of the line keep their width. */
		const accountName = (account) => (0, react.createElement)(react.Fragment, null, (0, react.createElement)("span", {
			className: "dmg-sidebar-account",
			"data-dmg-sidebar-account": "",
			title: account.label
		}, account.label), account.plan === void 0 ? null : (0, react.createElement)("span", { className: "dmg-sidebar-plan" }, account.plan));
		/** Title of a multi-account group: the provider once, with its account count. */
		const groupTitle = (card, count, window) => (0, react.createElement)("div", {
			className: "dmg-sidebar-group-title",
			"data-dmg-sidebar-group-title": ""
		}, (0, react.createElement)("span", { className: "dmg-sidebar-group-label" }, card.name ?? card.provider), window === void 0 ? null : windowLabel(window, true), (0, react.createElement)("span", { className: "dmg-sidebar-count" }, t("sidebarAccountCount", { n: count })));
		const cardKey = (card, index) => `${cardIdentity(card)}\u0000${index}`;
		/** Collapsed body: one-card providers as before, same-provider accounts under one title. */
		function compactGroups(cards, rows, now) {
			return sidebarGroups(cards).map((group) => {
				if (group.indexes.length === 1) return compactRow(rows[group.indexes[0]], now, cardKey(cards[group.indexes[0]], group.indexes[0]));
				const first = cards[group.indexes[0]];
				const lines = group.indexes.map((index) => rows[index]);
				const shared = lines.every((row) => !row.failed && row.windows.length === 1 && row.windows[0].window.name !== void 0 && row.windows[0].window.name === lines[0].windows[0]?.window.name && row.windows[0].fallback === lines[0].windows[0]?.fallback) ? lines[0].windows[0] : void 0;
				return (0, react.createElement)("div", {
					className: "dmg-sidebar-group",
					"data-dmg-sidebar-group": group.provider,
					key: cardKey(first, group.indexes[0])
				}, groupTitle(first, group.indexes.length, shared), ...group.indexes.map((index, position) => compactRow(rows[index], now, cardKey(cards[index], index), accountOf(cards[index], position + 1), shared !== void 0)));
			});
		}
		/** The gateway's own window name, in brackets next to the account on single-line rows. */
		function windowLabel(row, parens) {
			if (row.window.name === void 0) return null;
			return (0, react.createElement)("span", {
				className: "dmg-sidebar-window",
				"data-dmg-sidebar-tier": row.kind,
				...windowTitle(row)
			}, parens ? `(${row.window.name})` : row.window.name);
		}
		const windowTitle = (row) => row.fallback && row.window.name !== void 0 ? { title: t("sidebarWindowFallbackTitle", { window: row.window.name }) } : {};
		/** Absolute reset deadline; the full timestamp stays in `title`, and a missing one shows `—`. */
		function expiry(window, now) {
			const resetsAt = window.resetsAt;
			const label = resetsAt === void 0 ? void 0 : formatResetDeadline(resetsAt, now);
			if (resetsAt === void 0 || label === void 0) return (0, react.createElement)("span", {
				className: "dmg-sidebar-expiry is-unknown",
				"data-dmg-sidebar-expiry": "",
				"data-unknown": "",
				title: t("sidebarResetUnknown")
			}, "—");
			return (0, react.createElement)("span", {
				className: "dmg-sidebar-expiry",
				"data-dmg-sidebar-expiry": "",
				title: `${t("usageResetAt")}${formatTime(resetsAt)}`
			}, label);
		}
		/** Does this scroll container scroll at all? */
		const overflows = (element) => element !== null && element.scrollHeight - element.clientHeight > 1;
		/** Does this scroll container still have content below the fold? */
		const belowFold = (element) => element !== null && element.scrollHeight - element.scrollTop - element.clientHeight > 1;
		const reading = (row) => (0, react.createElement)("span", {
			className: "dmg-sidebar-pct",
			"data-reading": "",
			...row.used === void 0 ? {} : { "data-level": usedLevel(row.used) }
		}, windowReading(row));
		const bar = (row) => row.used === void 0 ? null : (0, react.createElement)("div", {
			className: "dmg-sidebar-bar",
			"aria-hidden": true
		}, (0, react.createElement)("i", {
			"data-level": usedLevel(row.used),
			style: { width: `${row.used}%` }
		}));
		/** Expanded content: every upstream with every window, reset, balance and error. */
		function detail(cards, now, status) {
			if (status !== void 0) return (0, react.createElement)("p", {
				className: "dmg-sidebar-status",
				role: "status"
			}, status);
			const section = (card, index, account) => (0, react.createElement)("section", {
				className: "dmg-sidebar-prov",
				"data-provider": card.provider,
				key: cardKey(card, index)
			}, (0, react.createElement)("div", { className: "dmg-sidebar-prov-head" }, account === void 0 ? (0, react.createElement)("strong", null, card.name ?? card.provider) : (0, react.createElement)("strong", {
				className: "dmg-sidebar-account",
				"data-dmg-sidebar-account": "",
				title: account.label
			}, account.label), (0, react.createElement)("span", { className: "dmg-sidebar-meta" }, providerMeta(card, now))), card.error !== void 0 ? (0, react.createElement)("p", { className: "dmg-sidebar-error" }, card.error) : (card.windows ?? []).filter((window) => window.unlimited === true || !textReading(window)).map((window, index) => {
				const used = typeof window.used === "number" && Number.isFinite(window.used) && !textReading(window) ? Math.min(100, Math.max(0, window.used)) : void 0;
				const level = used === void 0 ? void 0 : usedLevel(used);
				return (0, react.createElement)("div", {
					className: "dmg-sidebar-win",
					key: index
				}, (0, react.createElement)("div", { className: "dmg-sidebar-win-line" }, (0, react.createElement)("span", { className: "dmg-sidebar-win-name" }, window.name ?? "—"), (0, react.createElement)("span", {
					className: "dmg-sidebar-pct",
					...level === void 0 ? {} : { "data-level": level }
				}, windowReading(window)), resetShort(window.resetsAt, now) === void 0 ? null : (0, react.createElement)("span", {
					className: "dmg-sidebar-reset",
					title: window.resetsAt
				}, resetShort(window.resetsAt, now))), used === void 0 ? null : (0, react.createElement)("div", {
					className: "dmg-sidebar-bar",
					"aria-hidden": true
				}, (0, react.createElement)("i", {
					"data-level": level,
					style: { width: `${used}%` }
				})));
			}), card.resets !== void 0 || card.balance !== void 0 ? (0, react.createElement)("div", { className: "dmg-sidebar-foot" }, typeof card.resets?.count === "number" ? (0, react.createElement)("span", null, resetLine(card.resets.count)) : null, card.resets?.until === void 0 ? null : (0, react.createElement)("span", null, formatTime(card.resets.until)), card.balance === void 0 ? null : (0, react.createElement)("span", null, t("usageBalance"), " ", (0, react.createElement)("b", null, String(card.balance)))) : null);
			return (0, react.createElement)(react.Fragment, null, ...sidebarGroups(cards).map((group) => group.indexes.length === 1 ? section(cards[group.indexes[0]], group.indexes[0]) : (0, react.createElement)("div", {
				className: "dmg-sidebar-group",
				"data-dmg-sidebar-group": group.provider,
				key: cardKey(cards[group.indexes[0]], group.indexes[0])
			}, groupTitle(cards[group.indexes[0]], group.indexes.length), ...group.indexes.map((index, position) => section(cards[index], index, accountOf(cards[index], position + 1))))));
		}
		const statusText = (view, error) => {
			if (error !== "") return t("usageError");
			if (view === void 0) return t("usageReading");
			if (view.status === "forbidden") return t("usageForbidden");
			if (view.status === "unconfigured") return t("usageUnconfigured");
			if (view.status === "error") return view.error ?? t("usageError");
			if (view.cards.length === 0) return t("usageEmpty");
		};
		const providerMeta = (card, now) => {
			const parts = [];
			if (card.plan !== void 0) parts.push(card.plan);
			const read = cardReadTime(card);
			if (read !== void 0) {
				const age = ageText(read, now);
				if (card.asOf !== void 0) parts.push(`${t("usageReadAtStale")} ${formatTime(read)}`);
				else parts.push(age ?? formatTime(read));
			}
			return parts.join(" · ");
		};
		const resetShort = (resetsAt, now) => formatResetShort(resetsAt, now);
		const resetLine = (count) => count === 1 ? t("resetCountLineOne") : t("resetCountLineMany", { n: count });
		const windowReading = (window) => {
			if (window.unlimited === true) return t("unlimited");
			if (window.display !== void 0 && window.display !== "") return window.display;
			if (typeof window.used === "number" && Number.isFinite(window.used)) return formatUsed(Math.min(100, Math.max(0, window.used)));
			return "—";
		};
		const ageText = (readAt, now) => {
			const minutes = ageMinutes(readAt, now);
			if (minutes === void 0) return void 0;
			if (minutes < 1) return t("sidebarJustNow");
			if (minutes < 60) return t("sidebarMinutesAgo", { n: minutes });
			const hours = Math.floor(minutes / 60);
			if (hours < 24) return t("sidebarHoursAgo", { n: hours });
			return t("sidebarDaysAgo", { n: Math.floor(hours / 24) });
		};
		const refreshButton = (refresh, busy) => (0, react.createElement)("button", {
			type: "button",
			className: "dmg-sidebar-icon",
			"data-dmg-sidebar-refresh": "",
			"aria-label": t("refresh"),
			title: t("refresh"),
			disabled: busy,
			onClick: (event) => {
				event.stopPropagation();
				refresh();
			}
		}, refreshIcon());
		const refreshIcon = () => (0, react.createElement)("svg", {
			viewBox: "0 0 16 16",
			fill: "none",
			stroke: "currentColor",
			strokeWidth: "1.4",
			"aria-hidden": true
		}, (0, react.createElement)("path", { d: "M13 8a5 5 0 1 1-1.6-3.7" }), (0, react.createElement)("path", { d: "M13 2.4V5h-2.6" }));
		const chevron = (open) => (0, react.createElement)("svg", {
			viewBox: "0 0 16 16",
			fill: "none",
			stroke: "currentColor",
			strokeWidth: "1.4",
			"aria-hidden": true,
			className: `dmg-sidebar-chevron${open ? " is-open" : ""}`
		}, (0, react.createElement)("path", { d: "M4 6.5l4 4 4-4" }));
		const doubleChevron = () => (0, react.createElement)("svg", {
			viewBox: "0 0 16 16",
			fill: "none",
			stroke: "currentColor",
			strokeWidth: "1.4",
			"aria-hidden": true
		}, (0, react.createElement)("path", { d: "M4 6l4 4 4-4" }), (0, react.createElement)("path", {
			d: "M4 10l4 4 4-4",
			opacity: ".55"
		}));
		/**
		* Fixed position of the rail popover: above the icon, left-aligned, kept inside the
		* viewport. Local because the shell's `useAnchoredPosition` left
		* `@deepseek-ai/dsh-client-ui-primitives` after 0.2.2-rc.1.
		*/
		function useRailPosition(open, anchorRef, panelRef) {
			const [pos, setPos] = (0, react.useState)(null);
			(0, react.useLayoutEffect)(() => {
				if (!open) {
					setPos(null);
					return;
				}
				const place = () => {
					const anchor = anchorRef.current, panel = panelRef.current;
					if (anchor === null || panel === null) return;
					const rect = anchor.getBoundingClientRect(), margin = 12, gap = 8;
					const width = document.documentElement.clientWidth || window.innerWidth;
					const height = document.documentElement.clientHeight || window.innerHeight;
					const left = Math.max(margin, Math.min(rect.left, width - margin - panel.offsetWidth));
					const top = Math.max(margin, Math.min(rect.top - gap - panel.offsetHeight, height - margin - panel.offsetHeight));
					setPos((current) => current?.left === left && current.top === top ? current : {
						left,
						top
					});
				};
				place();
				window.addEventListener("resize", place);
				window.addEventListener("scroll", place, true);
				return () => {
					window.removeEventListener("resize", place);
					window.removeEventListener("scroll", place, true);
				};
			}, [
				open,
				anchorRef,
				panelRef
			]);
			return pos;
		}
		// src/client/SpeedSelect.ts
		/**
		* Composer speed control (`conversation.input.right`): standard / fast for
		* models whose gateway catalog advertises the `priority` service tier. The
		* choice lives in host memory per session (design D9); this component only
		* views it. It renders nothing unless the session's current model is a
		* owner-route (`dsh-magpie-connector-<owner>`) model listed in `fastModels`.
		*/
		/** Owner-route id shape (D4/D8); must match the host's `isMagpieRoute` in catalog.ts. Client does not import host code. */
		const MAGPIE_ROUTE = /^dsh-magpie-connector-[a-z0-9][a-z0-9._-]{0,47}$/;
		function isMagpieRoute(provider) {
			return MAGPIE_ROUTE.test(provider);
		}
		/**
		* Calls `onChange` when the session's selected provider/model changes. Other store
		* updates (including the ones our own `load()` causes) are ignored, so a reload
		* never re-triggers itself. No-op when the store is unavailable.
		*/
		function createModelWatcher(models, sessionId) {
			return (onChange) => {
				try {
					const store = models()?.directoryFor(sessionId).store;
					if (!store) return () => {};
					const key = () => {
						const c = store.getSnapshot()?.current;
						return c ? `${c.provider}\n${c.model}` : "";
					};
					let last = key();
					return store.subscribe(() => {
						const next = key();
						if (next !== last) {
							last = next;
							onChange();
						}
					});
				} catch {
					return () => {};
				}
			};
		}
		function createSpeedLoader(api, models, sessionId) {
			return async () => {
				const directories = models();
				const current = directories === void 0 ? null : (await directories.directoryFor(sessionId).load()).current;
				const response = await api({
					method: "GET",
					path: "speed",
					query: { session: sessionId }
				});
				if (!isOk(response)) throw new Error(`HTTP ${response.status}`);
				const body = response.body;
				const fastModels = Array.isArray(body.fastModels) ? body.fastModels.filter((m) => typeof m === "string") : [];
				const tier = body.tier === "fast" ? "fast" : "standard";
				return {
					visible: current !== null && isMagpieRoute(current.provider) && fastModels.includes(current.model),
					tier
				};
			};
		}
		function createSpeedSetter(api, sessionId) {
			return (tier) => api({
				method: "POST",
				path: "speed",
				body: {
					session: sessionId,
					tier
				}
			}).then(isOk, () => false);
		}
		const POLL_MS = 3e3;
		/** Tier presentation: the labels live in the locale dictionaries, not here. */
		const TIERS = [{
			id: "standard",
			nameKey: "speedTierStandard",
			descriptionKey: "speedTierStandardDescription"
		}, {
			id: "fast",
			nameKey: "speedTierFast",
			descriptionKey: "speedTierFastDescription"
		}];
		function SpeedSelect({ loadSpeed, setSpeed, watchModel }) {
			const [state, setState] = (0, react.useState)(null);
			const [open, setOpen] = (0, react.useState)(false);
			const [busy, setBusy] = (0, react.useState)(false);
			const [failed, setFailed] = (0, react.useState)(false);
			const rootRef = (0, react.useRef)(null);
			const loadRef = (0, react.useRef)(loadSpeed);
			const requests = (0, react.useRef)({
				active: false,
				read: 0,
				mutation: 0,
				writing: false
			});
			loadRef.current = loadSpeed;
			const reload = async () => {
				const load = loadRef.current;
				const current = requests.current;
				if (!load || !current.active) return;
				const version = ++current.read;
				const mutation = current.mutation;
				try {
					const next = await load();
					if (!current.active || version !== current.read || mutation !== current.mutation) return;
					const writing = current.writing;
					setState((previous) => writing && previous ? {
						...next,
						tier: previous.tier
					} : next);
					if (!next.visible) setOpen(false);
				} catch {}
			};
			(0, react.useEffect)(() => {
				const current = requests.current;
				current.active = true;
				let inflight = false;
				let pending = false;
				const poll = () => {
					if (inflight) {
						pending = true;
						return;
					}
					inflight = true;
					reload().finally(() => {
						inflight = false;
						if (pending) {
							pending = false;
							poll();
						}
					});
				};
				poll();
				const timer = setInterval(poll, POLL_MS);
				const unwatch = watchModel?.(poll) ?? (() => {});
				return () => {
					current.active = false;
					current.read++;
					current.mutation++;
					clearInterval(timer);
					unwatch();
				};
			}, []);
			(0, react.useEffect)(() => {
				if (!open) return;
				const outside = (event) => {
					if (!rootRef.current?.contains(event.target)) setOpen(false);
				};
				document.addEventListener("mousedown", outside);
				return () => document.removeEventListener("mousedown", outside);
			}, [open]);
			if (!loadSpeed || !setSpeed || !state?.visible) return null;
			const choose = async (tier) => {
				const current = requests.current;
				if (!current.active || current.writing) return;
				if (tier === state.tier) {
					setOpen(false);
					return;
				}
				current.writing = true;
				const mutation = ++current.mutation;
				current.read++;
				setBusy(true);
				setFailed(false);
				let ok = false;
				try {
					ok = await setSpeed(tier);
				} catch {}
				if (!current.active || mutation !== current.mutation) return;
				current.writing = false;
				current.mutation++;
				current.read++;
				setBusy(false);
				if (ok) {
					setState((previous) => previous ? {
						...previous,
						tier
					} : previous);
					setOpen(false);
					reload();
				} else setFailed(true);
			};
			const label = t("speedLabel", { tier: t(TIERS.find((tier) => tier.id === state.tier).nameKey) });
			return (0, react.createElement)("div", {
				ref: rootRef,
				className: "dmg-speed",
				"data-magpie-speed": "",
				onKeyDown: (event) => {
					if (event.key === "Escape" && open) {
						event.preventDefault();
						setOpen(false);
					}
				}
			}, (0, react.createElement)("style", null, settingsCss), failed ? (0, react.createElement)("span", {
				className: "dmg-error",
				role: "alert"
			}, t("speedSaveFailed")) : null, open ? (0, react.createElement)("div", {
				className: "dmg-speed-menu",
				role: "menu",
				"aria-label": t("speedMenu")
			}, ...TIERS.map((tier) => (0, react.createElement)("button", {
				key: tier.id,
				type: "button",
				role: "menuitemradio",
				className: "dmg-speed-item",
				"data-tier": tier.id,
				"aria-checked": tier.id === state.tier,
				disabled: busy,
				onClick: () => choose(tier.id)
			}, (0, react.createElement)("span", null, tier.id === state.tier ? "✓" : ""), (0, react.createElement)("span", null, t(tier.nameKey), (0, react.createElement)("small", null, t(tier.descriptionKey)))))) : null, (0, react.createElement)("button", {
				type: "button",
				className: "dmg-speed-trigger",
				"aria-haspopup": "menu",
				"aria-expanded": open,
				title: label,
				disabled: busy,
				onClick: () => {
					if (open) {
						setOpen(false);
						return;
					}
					setOpen(true);
					reload();
				}
			}, label));
		}
		// src/client/settings-nav-icon.ts
		const birdMask = `url("data:image/svg+xml,${encodeURIComponent(birdSvg)}") center / contain no-repeat`;
		/** Reuse the licensed bird artwork without reaching into the navigation DOM. */
		function MagpieSettingsNavIcon({ size }) {
			return (0, react.createElement)("span", {
				"aria-hidden": true,
				style: {
					display: "inline-block",
					width: size,
					height: size,
					backgroundColor: "currentColor",
					mask: birdMask,
					WebkitMask: birdMask
				}
			});
		}
		// src/client/index.ts
		const name = "dsh-magpie-connector/client";
		const inject = ["slots", "locale"];
		function apply(ctx, api = createFetchApi()) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "dsh-magpie-connector: dictionaries");
			ctx.effect(() => {
				const element = ensureStyles();
				return () => {
					element?.remove();
				};
			}, "dsh-magpie-connector: styles");
			bindLocale(ctx.locale.bind(NS));
			const label = () => "Magpie";
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "dsh-magpie-connector",
				order: 13,
				label,
				inject: () => ({ api })
			}, MagpieSettings));
			ctx.slots.inject("settings.section.icon", () => ctx.slots.register({
				name: "settings.section.icon",
				id: "dsh-magpie-connector"
			}, MagpieSettingsNavIcon));
			ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
				name: "sidebar.footer.action",
				id: "magpie-usage",
				order: 10,
				inject: () => ({ api })
			}, SidebarUsage));
			const models = () => ctx.get("modelDirectories");
			ctx.slots.inject("conversation.input.right", () => ctx.slots.register({
				name: "conversation.input.right",
				id: "dsh-magpie-connector-speed",
				order: 1,
				inject: (sessionId) => {
					const id = typeof sessionId === "string" ? sessionId : "";
					return {
						loadSpeed: createSpeedLoader(api, models, id),
						setSpeed: createSpeedSetter(api, id),
						watchModel: createModelWatcher(models, id)
					};
				}
			}, SpeedSelect));
		}
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});

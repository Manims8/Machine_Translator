import { createId } from './id.js'

const KEY='trilingua-history-v1', SETTINGS='trilingua-settings-v1', LIMIT=20
export function isHistoryEnabled(){try{return JSON.parse(localStorage.getItem(SETTINGS)??'{"historyEnabled":true}').historyEnabled!==false}catch{return true}}
export function setHistoryEnabled(value){let s={};try{s=JSON.parse(localStorage.getItem(SETTINGS)||'{}')}catch{}localStorage.setItem(SETTINGS,JSON.stringify({...s,historyEnabled:Boolean(value)}))}
export function getHistory(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return []}}
export function addHistory(record){if(!isHistoryEnabled()||!record?.sourceText||!record?.translatedText)return getHistory();const next=[{...record,id:createId(),timestamp:Date.now()},...getHistory()].slice(0,LIMIT);localStorage.setItem(KEY,JSON.stringify(next));return next}
export function deleteHistory(id){const next=getHistory().filter(x=>x.id!==id);localStorage.setItem(KEY,JSON.stringify(next));return next}
export function clearHistory(){localStorage.removeItem(KEY)}

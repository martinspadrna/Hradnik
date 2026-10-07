/* Hradník — reference shell enforcement + final desktop/mobile alignment. */
function style(){if(document.getElementById('reference-force-style'))return;const s=document.createElement('style');s.id='reference-force-style';s.textContent=`
:root{--rf-bg:#080b0e;--rf-panel:#10161a;--rf-line:#293238;--rf-gold:#f0c44a;--rf-text:#f3f1eb;--hr-mobile-header-content:56px;--hr-mobile-header-height:calc(var(--hr-mobile-header-content) + env(safe-area-inset-top,0px));--hr-mobile-nav-height:76px}
html,body,#app{background:var(--rf-bg)!important;color:var(--rf-text)!important}
@media(min-width:851px){
header{position:fixed!important;inset:0 0 auto 0!important;height:85px!important;padding:0 20px!important;background:#080b0e!important;border-bottom:1px solid #252e33!important;z-index:910!important}
header .top{height:85px!important;min-height:85px!important;margin:0!important;padding:0!important;display:flex!important;align-items:center!important;gap:18px!important}
header .top>div:first-child{display:flex!important;align-items:center!important;flex:0 0 250px!important;min-width:250px!important}
header .top>div:first-child .logo{width:190px!important;height:54px!important;margin:0!important;padding:0!important;font-size:0!important;background:url('/hradnik-logo.svg') left center/contain no-repeat!important;color:transparent!important}
header .top>div:first-child .sub{display:none!important}
header>button,header .top>button,.mobileHeaderMenu{display:none!important}
.globalSearchWrap{position:relative!important;flex:0 0 410px!important;width:410px!important;height:45px!important}
.globalSearch{width:410px!important;height:45px!important;box-sizing:border-box!important;border-radius:8px!important;background:#11171b!important;border:1px solid #30383d!important;color:#f3f1eb!important;padding:0 16px 0 44px!important;font-size:15px!important}
.reference-force-search-icon{position:absolute!important;left:14px!important;top:12px!important;width:20px!important;height:20px!important;pointer-events:none!important}
.reference-force-count{font-size:15px!important;font-weight:700!important;white-space:nowrap!important}
.account{margin-left:auto!important;display:flex!important;gap:10px!important}
.account b{display:none!important}
.account button{width:46px!important;height:46px!important;padding:0!important;border-radius:10px!important;background:#11171b!important;border:1px solid #30383d!important;font-size:0!important;display:grid!important;place-items:center!important}
.account button img{width:22px!important;height:22px!important}
.redesign-sidebar{display:flex!important;position:fixed!important;left:0!important;top:85px!important;bottom:0!important;width:194px!important;box-sizing:border-box!important;padding:24px 11px 16px!important;background:linear-gradient(180deg,#0d1317,#0a0e11)!important;border-right:1px solid #252e33!important;z-index:900!important;flex-direction:column!important}
.redesign-sidebar .nav{display:flex!important;flex-direction:column!important;gap:4px!important;width:100%!important;margin:0!important;padding:0!important}
.redesign-sidebar .nav button{display:flex!important;width:100%!important;height:53px!important;box-sizing:border-box!important;align-items:center!important;justify-content:flex-start!important;gap:15px!important;padding:0 14px!important;border:0!important;border-radius:8px!important;background:transparent!important;color:#f0efeb!important;font-size:15px!important;font-weight:700!important;cursor:pointer!important}
.redesign-sidebar .nav button img{width:24px!important;height:24px!important;flex:0 0 24px!important}
.redesign-sidebar .nav button.active{background:#37301f!important;color:var(--rf-gold)!important}
.reference-force-brand{display:flex!important;align-items:center!important;gap:12px!important;margin-top:auto!important;padding:12px 10px!important;border:1px solid #293238!important;border-radius:10px!important;color:#f1eee5!important;font-size:12px!important;line-height:1.4!important}
.reference-force-brand img{width:50px!important;height:50px!important;object-fit:contain!important}
main.wrap.redesign-main{margin:85px 0 0 194px!important;width:calc(100% - 194px)!important;max-width:none!important;padding:0!important}
.redesign-main #content>section:has(#map){margin:0!important;padding:0!important;max-width:none!important;position:relative!important}
.hero,.mapFilters,.mapLegend,#content>section>.sectionTitle{display:none!important}
#content:has(#map){width:100%!important}
#content:has(#map) #map{height:512px!important;width:100%!important;border:0!important;border-radius:0!important}
body:has(.overlay) #content:has(#map) #map{width:calc(100% - 307px)!important}
.overlay{position:fixed!important;inset:85px 0 0 194px!important;background:transparent!important;z-index:880!important;pointer-events:none!important}
.overlay .sheet{position:absolute!important;right:0!important;top:0!important;width:307px!important;height:100%!important;box-sizing:border-box!important;overflow:auto!important;border:0!important;border-left:1px solid #2a3338!important;border-radius:0!important;background:linear-gradient(180deg,#11171b,#0c1114)!important;padding:18px!important;pointer-events:auto!important}
.overlay .sheet .close{position:absolute!important;right:14px!important;top:12px!important;width:34px!important;height:34px!important;border:1px solid #30383d!important;border-radius:8px!important;background:#171d20!important;color:#eee!important;font-size:23px!important;z-index:2!important}
.overlay .sheet .bigIcon{width:56px!important;height:56px!important;display:grid!important;place-items:center!important;margin:2px 0 14px!important;border:1px solid #313a3f!important;border-radius:12px!important;background:#171d20!important}
.overlay .sheet .bigIcon img{width:34px!important;height:34px!important}
.overlay .sheet h1{font-family:Georgia,'Times New Roman',serif!important;font-size:25px!important;line-height:1.12!important;margin:4px 42px 4px 0!important}
.overlay .sheet .eyebrow{color:var(--rf-gold)!important;font-size:11px!important;font-weight:800!important}
.overlay .sheet .muted{color:#aeb7bc!important}
.overlay .sheet .actions{display:grid!important;grid-template-columns:1fr!important;gap:7px!important;margin:18px 0!important}
.overlay .sheet .actions button{min-height:42px!important;border:1px solid #30383d!important;border-radius:8px!important;background:#171d20!important;color:#f3f1eb!important;font-weight:700!important}
.overlay .sheet .actions .primary{background:#37301f!important;border-color:#695a2b!important;color:var(--rf-gold)!important}
.overlay .sheet .detailGrid{display:grid!important;grid-template-columns:1fr!important;gap:8px!important}
.overlay .sheet .detailGrid .card{background:#151b1f!important;border:1px solid #293238!important;border-radius:9px!important;padding:12px!important}
.overlay .sheet .detailGrid h3{font-size:11px!important;text-transform:uppercase!important;letter-spacing:.06em!important;color:#aeb7bc!important;margin:0 0 5px!important}
.overlay .sheet .detailGrid p{font-size:14px!important;line-height:1.5!important;margin:0!important}
.overlay .sheet a{color:var(--rf-gold)!important}
}
@media(max-width:850px){
header{height:var(--hr-mobile-header-height)!important;min-height:var(--hr-mobile-header-height)!important;box-sizing:border-box!important;position:sticky!important;top:0!important;padding:env(safe-area-inset-top,0px) 12px 0!important;background:#080b0e!important;border-bottom:1px solid #242d32!important;z-index:910!important}
header .top{height:var(--hr-mobile-header-content)!important;min-height:var(--hr-mobile-header-content)!important;margin:0!important;padding:0!important;display:flex!important;align-items:center!important;justify-content:space-between!important;position:relative!important}
header .top>div:first-child{position:absolute!important;left:50%!important;transform:translateX(-50%)!important;display:flex!important;align-items:center!important}
header .top>div:first-child .logo{width:128px!important;height:34px!important;font-size:0!important;background:url('/hradnik-logo.svg') center/contain no-repeat!important;color:transparent!important}
header .top>div:first-child .sub,header .account{display:none!important}
.mobileHeaderMenu{display:grid!important;place-items:center!important;width:40px!important;height:40px!important;padding:0!important;border:0!important;background:transparent!important;z-index:3!important}
.mobileHeaderMenu span{display:block!important;width:21px!important;height:2px!important;background:#eee!important;margin:2px 0!important}
.mobileHeaderSearch{display:grid!important;place-items:center!important;width:40px!important;height:40px!important;border:0!important;background:transparent!important;padding:0!important;margin-left:auto!important}
.mobileHeaderSearch img{width:24px!important;height:24px!important}
.globalSearchWrap,.reference-force-count{display:none!important}
main.wrap.redesign-main{width:100%!important;margin:0!important;padding:0 8px 84px!important;max-width:none!important}
.redesign-sidebar{height:76px!important;top:auto!important;bottom:0!important;left:0!important;right:0!important;width:100%!important;padding:4px 8px calc(4px + env(safe-area-inset-bottom))!important;background:#090d10!important;border-top:1px solid #273137!important;box-sizing:border-box!important;z-index:920!important}
.redesign-sidebar .nav{height:68px!important;display:grid!important;grid-template-columns:repeat(4,1fr)!important;gap:1px!important}
.redesign-sidebar .nav button{height:66px!important;padding:5px 2px!important;border-radius:8px!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:3px!important;color:#f0f0ed!important;font-size:10px!important;font-weight:700!important;background:transparent!important}
.redesign-sidebar .nav button img{width:24px!important;height:24px!important}
.redesign-sidebar .nav button:nth-child(5){display:none!important}
.reference-force-brand{display:none!important}
.hero,.mapFilters,.mapLegend,#content>section>.sectionTitle{display:none!important}
#content:has(#map) #map{height:calc(100dvh - var(--hr-mobile-header-height) - var(--hr-mobile-nav-height))!important;min-height:0!important;width:100%!important;border:0!important;border-radius:0!important}
.overlay{position:fixed!important;inset:var(--hr-mobile-header-height) 0 var(--hr-mobile-nav-height)!important;background:rgba(0,0,0,.55)!important;z-index:915!important}
.overlay .sheet{position:absolute!important;left:0!important;right:0!important;bottom:0!important;max-height:92%!important;overflow:auto!important;border:1px solid #293238!important;border-bottom:0!important;border-radius:16px 16px 0 0!important;background:#10161a!important;padding:18px!important}
.overlay .sheet .close{position:absolute!important;right:14px!important;top:12px!important;width:36px!important;height:36px!important;border:1px solid #30383d!important;border-radius:9px!important;background:#171d20!important;color:#eee!important;font-size:24px!important}
.overlay .sheet h1{font-family:Georgia,'Times New Roman',serif!important;font-size:24px!important;line-height:1.15!important;margin:5px 44px 4px 0!important}
.overlay .sheet .actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:7px!important;margin:16px 0!important}
.overlay .sheet .actions #want{grid-column:1/-1!important}
.overlay .sheet .actions button{min-height:42px!important;border:1px solid #30383d!important;border-radius:8px!important;background:#171d20!important;color:#f3f1eb!important;font-weight:700!important}
.overlay .sheet .actions .primary{background:#37301f!important;border-color:#695a2b!important;color:var(--rf-gold)!important}
.overlay .sheet .detailGrid{display:grid!important;grid-template-columns:1fr!important;gap:8px!important}
.overlay .sheet .detailGrid .card{background:#151b1f!important;border:1px solid #293238!important;border-radius:9px!important;padding:12px!important}
.overlay .sheet .detailGrid h3{font-size:11px!important;text-transform:uppercase!important;color:#aeb7bc!important;margin:0 0 5px!important}
.overlay .sheet a{color:var(--rf-gold)!important}
}
`;document.head.appendChild(s)}
// DOM ownership moved to reference-runtime-retry.js. This module is now
// intentionally style-only so it cannot race the navigation/header runtime.
function start(){style()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start()

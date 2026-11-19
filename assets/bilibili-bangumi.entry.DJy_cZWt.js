import{r as d,h as e}from"./index.B5c2d9tn.js";import"./framework.CRxGx2Uu.js";function b(a){return Object.entries(a).filter(([,n])=>!!n).map(([n,t])=>`${n}=${t}`).join("&")}function c(a){if(!a.startsWith("http"))return a;const n=new URL(a),t=n.pathname==="/"?"":n.pathname;return`${n.origin}${t}`}function f(a,n){let t;return function(...i){t||(t=setTimeout(()=>{t=null,a.apply(this,i)},n))}}const r={全部:"0",想看:"1",在看:"2",看过:"3",搁置:"4",抛弃:"5"},x={全部:"0",想玩:"1",在玩:"2",玩过:"3",搁置:"4",抛弃:"5"},p={全部:"0",想读:"1",在读:"2",读过:"3",搁置:"4",抛弃:"5"},u={动画:r,游戏:x,书籍:p,音乐:p,三次元:r},g={动画:"1",游戏:"2",书籍:"3",音乐:"4",三次元:"5"},h={动画:["全部","想看","在看","看过","搁置","抛弃"],游戏:["全部","想玩","在玩","玩过","搁置","抛弃"],书籍:["全部","想读","在读","读过","搁置","抛弃"],音乐:["全部","想听","在听","听过","搁置","抛弃"],三次元:["全部","想看","在看","看过","搁置","抛弃"]};async function v(a,n){const t=Object.assign(Object.assign({},n),{collectionType:r[n.collectionType]});return await(await fetch(`${c(a)}/bilibili?${b(t)}`)).json()}async function y(a,n){const{subjectType:t}=n,i=Object.assign(Object.assign({},n),{collectionType:u[t][n.collectionType],subjectType:g[n.subjectType]});return await(await fetch(`${c(a)}/bgm?${b(i)}`)).json()}async function j(a,n){const{subjectType:t}=n,i=Object.assign(Object.assign({},n),{collectionType:u[t][n.collectionType],subjectType:g[n.subjectType]});return await(await fetch(`${c(a)}/custom?${b(i)}`)).json()}function l({activeLabel:a,labels:n,containerState:t,onChange:i}){const o=s=>{a!==s&&i(s)};return e("div",{class:"bbc-tabs"},n.map(s=>e("div",{class:{"bbc-tab-item":!0,"bbc-tab-item-active":s===a,"bbc-md-tab-item":t!=="large"},key:s,onClick:()=>o(s)},s)))}function m(){return e("div",{class:"bbc-skeleton-container bbc-bangumi-item"},e("div",{class:"bbc-skeleton-avatar"}),e("div",{class:"bbc-skeleton-content bbc-bangumi-content"},e("div",{class:"bbc-skeleton-row",style:{width:"30%"}}),e("div",{class:"bbc-skeleton-row",style:{width:"60%",height:"40px"}}),e("div",{class:"bbc-skeleton-row",style:{width:"90%",height:"32px"}})))}const k=({containerState:a,labels:n})=>{let t=[...n];return a==="middle"&&(t=t.slice(0,4)),a==="small"&&(t=t.slice(0,3)),e("div",{class:"bbc-bangumi-labels"},t.map(i=>e("div",{class:{"bbc-bangumi-label":!0,"bbc-md-label-text":a!=="large"}},e("p",{class:"bbc-bangumi-label-title"},i.label),i.value&&e("p",null,i.value))))},w=({list:a,loading:n,containerState:t})=>e("div",{class:"bbc-bangumi"},a.map(i=>e("div",null,n?e(m,null):e("div",{class:"bbc-bangumi-item"},e("a",{href:i.url,target:"_blank",rel:"noreferrer"},e("img",{src:i.cover,alt:"cover",loading:"lazy",referrerpolicy:"no-referrer"})),e("div",{class:"bbc-bangumi-content"},e("h3",{class:"bbc-bangumi-title"},e("a",{href:i.url,target:"_blank",rel:"noreferrer",innerHTML:i.name?i.name:i.nameCN}),i.name&&e("small",{innerHTML:i.nameCN})),e(k,{containerState:t,labels:i.labels}),e("p",{class:"bbc-bangumi-summary",innerHTML:i.summary}))))));function C({pageNumber:a,totalPages:n,onChange:t,onInputChange:i}){return e("div",{class:"bbc-pagination"},e("a",{class:"bbc-pagination-button",onClick:()=>t("head")},"首页"),e("a",{class:"bbc-pagination-button",onClick:()=>t("prev")},"上一页"),e("span",{class:"bbc-pagination-pagenum"},`${a} / ${n}`),e("a",{class:"bbc-pagination-button",onClick:()=>t("next")},"下一页"),e("a",{class:"bbc-pagination-button",onClick:()=>t("tail")},"尾页"),e("div",{class:"bbc-pagination-input"},e("span",null,"跳至"),e("input",{type:"text",maxLength:4,onChange:i}),e("span",null,"页")))}function L(){return e("div",{class:"bbc-empty"},e("img",{src:"https://s1.hdslb.com/bfs/static/webssr/article/empty.png",alt:"empty",referrerpolicy:"no-referrer"}))}function T({error:a}){return e("div",{class:"bbc-error"},e("img",{src:"https://s1.hdslb.com/bfs/static/jinkela/long/bitmap/error_01.png",alt:"parse failed",referrerpolicy:"no-referrer"}),e("p",null,"Σ(oﾟдﾟoﾉ) 发生了一些错误"),e("p",null,`message: ${a.message}`))}const S=`@layer bilibili-bangumi-component {
  :host {
    display: block;
    /* 基础文本颜色 */
    --bbc-text-base-color: #4c4948;
    /* 标签颜色 */
    --bbc-label-color: #FF9843;
    /* 下划线、背景之类的颜色 */
    --bbc-primary-color: #425aef;
  }

  * {
    box-sizing: border-box;
  }

  a {
    text-decoration: none;
  }

  .bbc-tabs {
    display: flex;
    gap: 8px;
  }

  .bbc-tab-item {
    padding: 4px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: bold;
    color: var(--bbc-text-base-color);
    cursor: pointer;
  }

  .bbc-md-tab-item {
    padding: 4px 12px;
  }

  .bbc-tab-item:hover {
    background-color: var(--bbc-primary-color);
    color: white;
  }

  .bbc-tab-item-active {
    color: white;
    background-color: var(--bbc-primary-color);
  }

  .bbc-header-platform {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 16px;
  }

  .bbc-header-platform .divider {
    width: 3px;
    border-radius: 2px;
    height: 32px;
    background-color: var(--bbc-primary-color);
  }

  .bbc-bangumi:last-child {
    border-bottom: none;
  }

  .bbc-bangumi-item {
    display: flex;
    margin: 12px 0;
    gap: 16px;
    padding: 16px;
    border-bottom: 1px solid #ddd;
  }

  .bbc-bangumi-item img {
    border-radius: 8px;
    cursor: pointer;
    height: 140px;
    object-fit: cover;
    aspect-ratio: 3 / 4;
  }

  .bbc-bangumi-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .bbc-bangumi-title {
    margin: 0;
    margin-bottom: 8px;
  }

  .bbc-bangumi-title a {
    color: var(--bbc-text-base-color);
  }

  .bbc-bangumi-title a:hover {
    border-bottom: 2px solid var(--bbc-primary-color);
  }

  .bbc-bangumi-title small {
    margin-left: 8px;
    font-weight: normal;
    font-size: 14px;
    color: var(--bbc-text-base-color);
    height: 24px;
  }

  .bbc-bangumi-labels {
    color: var(--bbc-label-color);
    display: flex;
  }

  .bbc-bangumi-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;
    height: 36px;
    font-size: 14px;
    border-right: 1px solid var(--bbc-label-color);
  }

  .bbc-bangumi-label:last-child {
    border-right: none;
  }

  .bbc-bangumi-label p {
    margin: 0;
    padding: 0 4px;
  }

  .bbc-bangumi-label:not(.bbc-bangumi-label > .bbc-bangumi-label-title) {
    justify-content: center;
  }

  .bbc-md-label-text {
    font-size: 12px;
  }

  .bbc-bangumi-summary {
    margin-bottom: 0;
    font-size: 12px;
    color: var(--bbc-text-base-color);

    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .bbc-pagination {
    height: 40px;
    text-align: center;
    padding-right: 20px;
  }

  .bbc-pagination-button {
    border-radius: 4px;
    font-size: 14px;
    padding: 4px 8px;
    margin: 0 4px;
    color: #bbb;
    cursor: pointer;
  }

  .bbc-pagination-button:hover {
    background-color: var(--bbc-primary-color);
    color: white;
  }

  .bbc-pagination-pagenum {
    color: #bbb;
    font-size: 14px;
  }
  
  .bbc-pagination-input {
    display: inline-block;
    color: #bbb;
    font-size: 12px;
  }

  .bbc-pagination-input input {
    display: inline-block;
    margin: 0 8px;
    font-size: 12px;
    color: #bbb;
    width: 30px;
    height: 24px;
    line-height: 24px;
    border-radius: 4px;
    border: 1px solid #bbb;
    text-align: center;
    outline: none;
    transition: border .2s ease;
  }

  .bbc-skeleton-container {
    animation: skeleton-blink 1.2s ease-in-out infinite;
  }

  @keyframes skeleton-blink {
    50% {
      opacity: 0.6;
    }
  }

  .bbc-skeleton-avatar {
    height: 140px;
    border-radius: 12px;
    background-color: #f2f3f5;
    aspect-ratio: 3 / 4;
  }

  .bbc-skeleton-row {
    height: 24px;
    border-radius: 8px;
    background-color: #f2f3f5;
  }

  .bbc-empty {
    display: flex;
    padding: 40px 0;
    justify-content: center;
    align-items: center;
  }

  .bbc-empty img {
    height: 140px;
    object-fit: cover;
  }

  .bbc-error {
    margin: 20px 0;
    display: flex;
    gap: 12px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .bbc-error img {
    display: block;
    width: 260px;
  }

  .bbc-error p {
    margin: 0;
    color: var(--bbc-text-base-color);
    font-size: 18px;
  }
}`,N=S,D=class{constructor(a){d(this,a),this.platformLabels=["Bilibili","Bangumi"],this.subjectLabels=["动画","游戏","书籍","音乐","三次元"],this.fetchData=async()=>{try{this.loading=!0,this.error=null;let n;const t={uid:this.bilibiliUid,collectionType:this.activeCollection,pageSize:this.pageSize,pageNumber:this.pageNumber};this.activePlatform==="Bilibili"?n=await v(this.api,t):this.activePlatform==="Bangumi"?n=await y(this.api,Object.assign(Object.assign({},t),{uid:this.bgmUid,subjectType:this.activeSubject})):n=await j(this.api,Object.assign(Object.assign({},t),{subjectType:this.activeSubject})),n.code===200?this.responseData=n.data:(this.error=n,this.responseData=null)}catch(n){this.error=n,this.responseData=null}this.loading=!1},this.handlePlatformChange=n=>{this.collectionLabels=n==="Bilibili"?["全部","想看","在看","看过"]:h.动画,this.activePlatform=n,this.pageNumber=1,this.activeSubject="动画",this.activeCollection="全部",this.fetchData()},this.handleSubjectChange=n=>{this.collectionLabels=this.activePlatform==="Bilibili"?["全部","想看","在看","看过"]:h[n],this.activeSubject=n,this.pageNumber=1,this.activeCollection="全部",this.fetchData()},this.handleCollectionChange=n=>{this.activeCollection=n,this.pageNumber=1,this.fetchData()},this.scrollToTop=()=>{document.documentElement.scrollTo({top:0,behavior:"smooth"})},this.handlePageChange=n=>{const{totalPages:t}=this.responseData;switch(n){case"head":this.pageNumber=1;break;case"prev":if(this.pageNumber===1)return;this.pageNumber--;break;case"next":if(this.pageNumber===t)return;this.pageNumber++;break;case"tail":this.pageNumber=t;break}this.scrollToTop(),this.fetchData()},this.handleInputChange=n=>{const t=Number.parseInt(n.target.value);if(Object.is(t,Number.NaN))return;const{totalPages:i}=this.responseData;t<1?this.pageNumber=1:t>i?this.pageNumber=i:this.pageNumber=t,this.scrollToTop(),this.fetchData()},this.api=void 0,this.bilibiliUid=void 0,this.bgmUid=void 0,this.bilibiliEnabled=!0,this.bgmEnabled=!0,this.pageSize=15,this.customEnabled=!1,this.customLabel="自定义",this.loading=!1,this.error=void 0,this.pageNumber=1,this.responseData=void 0,this.activePlatform="Bilibili",this.activeSubject="动画",this.collectionLabels=["全部","想看","在看","看过"],this.activeCollection="全部",this.containerRef=null,this.containerState="large"}componentWillLoad(){const a=[...this.platformLabels];this.customEnabled&&a.push(this.customLabel);const n=[this.bilibiliEnabled,this.bgmEnabled,this.customEnabled];this.platformLabels=a.filter((t,i)=>n[i]),this.activePlatform=this.platformLabels[0],this.fetchData()}componentDidLoad(){const a=f(t=>{let i="large";t<=640&&(i="middle"),t<=465&&(i="small"),this.containerState=i},100).bind(this);new ResizeObserver(t=>{for(const i of t)a(i.contentRect.width)}).observe(this.containerRef)}render(){return e("div",{ref:a=>this.containerRef=a},e("div",{class:"bbc-header-platform"},e(l,{containerState:this.containerState,activeLabel:this.activePlatform,labels:this.platformLabels,onChange:this.handlePlatformChange}),this.activePlatform!=="Bilibili"&&e("div",{class:"divider"}),this.activePlatform!=="Bilibili"&&e(l,{containerState:this.containerState,activeLabel:this.activeSubject,labels:this.subjectLabels,onChange:this.handleSubjectChange})),e("div",null,e(l,{containerState:this.containerState,activeLabel:this.activeCollection,labels:this.collectionLabels,onChange:this.handleCollectionChange})),this.loading&&e(m,null),this.error&&e(T,{error:this.error}),this.responseData&&e(w,{containerState:this.containerState,loading:this.loading,list:this.responseData.list}),this.responseData&&this.responseData.total===0&&e(L,null),this.responseData&&e(C,{pageNumber:this.pageNumber,totalPages:this.responseData.totalPages,onChange:this.handlePageChange,onInputChange:this.handleInputChange}))}};D.style=N;export{D as bilibili_bangumi};

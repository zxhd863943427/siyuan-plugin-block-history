// let fetchSyncPost = openAPI.siyuan.fetchSyncPost
// let Dialog = openAPI.siyuan.Dialog
// let that = openAPI.plugin
import { isMobile, i18n } from "./utils"
import { fetchSyncPost, Dialog } from "siyuan"
import * as dayjs from "dayjs"

const time = console.time
const timeEnd = console.timeEnd

const memorize = function(fn) {
    const cache = {}       // 存储缓存数据的对象
    return function(...args) {        // 这里用到数组的扩展运算符
      const _args = JSON.stringify(args)    // 将参数作为cache的key
      return cache[_args] || (cache[_args] = fn.apply(fn, args))  // 如果已经缓存过，直接取值。否则重新计算并且缓存
    }
  }

async function getDocHistory(id:string,page=1):Promise<any>{
    let history = await fetchSyncPost("/api/history/searchHistory",{query: id, page: page, op: "all", type: 3})
    if (history.code === 0){
        if (history.data.pageCount <= page)
            return history.data.histories
        let nextHistory = await getDocHistory(id,page+1)
        return history.data.histories.concat(nextHistory)
    }  
}

async function getDocHistoryItemOrigin(id:string, time:string):Promise<string>{
    let item = await fetchSyncPost("/api/history/getHistoryItems",{query: id, op: "all", type: 3, created: time})
    if (item.code===0)
        return item.data.items[0].path
}
const getDocHistoryItem = memorize(getDocHistoryItemOrigin)


async function getDocHistoryContentOrigin(path:string){
    let docElem = document.createElement("div")
    // docElem.innerHTML = await fetchSyncPost("/api/history/getDocHistoryContent",{historyPath: path})
    let data = await fetchSyncPost("/api/history/getDocHistoryContent",{historyPath: path})
    if (data.code === 0)
        docElem.innerHTML = data.data.content
    return docElem
}
const getDocHistoryContent = memorize(getDocHistoryContentOrigin)

function searchBlock(docElem:HTMLElement,blockID:string) {
    return docElem.querySelector(`[data-node-id='${blockID}']`)
}

function isBlockUpdate(b:HTMLElement) {
    return (b.getAttribute("updated") != null)
}

function getBlockUpdate(blockDom:HTMLElement) {
    return blockDom.getAttribute("updated")
}
function getBlockCreate(blockDom:HTMLElement) {
    return blockDom.getAttribute("data-node-id").substring(0,14)
}

function isAfter(blockTime:string, historyTime:string) {
    return dayjs.default(blockTime).isAfter(dayjs.default(parseInt(historyTime) * 1000))
}

async function getHistoryBlock(docID:string,time:string,blockID:string) {
    let path = await getDocHistoryItem(docID, time)
    let docElem =  await getDocHistoryContent(path)
    let blockElem = searchBlock(docElem, blockID)
    return blockElem
}

function genTitle(time:string){
    let title = `
<li class="b3-list-item b3-list-item--hide-action" style='background-color: var(--b3-theme-surface);'>
    <span class="b3-list-item__text" title="">${dayjs.default(time).format("YYYY-MM-DD HH:mm:ss")}</span>
</li>
`
    return title
}

function genHistoryContent(blockList:any) {
    let content = ''
    for (let block of blockList){
        let time = getBlockUpdate(block)
        if (time === null) time = getBlockCreate(block)
        content += genTitle(time)
        block.style = "margin:5px 20px"
        content += block.outerHTML
    }
    return content
}

async function getBlockHistoryDomList(docID:string,blockID:string) {
    let currentTime = "20500101000000"
    let blockDomList = []
    let historyTimeList = await getDocHistory(docID)
    for (let historyTime of historyTimeList){
        if (!isAfter(currentTime, historyTime)) continue
        let blockDom = await getHistoryBlock(docID, historyTime, blockID)
        if (blockDom === null) break
        currentTime = getBlockUpdate(blockDom as HTMLElement)
        blockDomList.push(blockDom)
        if (currentTime === null) break
    }
    return blockDomList
}

async function getBlockHistory(docID:string, blockID:string) {
    let blockDomList = await getBlockHistoryDomList(docID,blockID)
    let content = genHistoryContent(blockDomList)
    return content
}
export async function showHistory(docID:string, blockID:string){
    let historyContent = await getBlockHistoyDom(docID, blockID)
    
     new Dialog({
                title: i18n.showDialog,
                content: historyContent,
                width: isMobile ? "92vw" : "750px",
            });
}

export async function getBlockHistoyDom(docID: string, blockID: string, height="40em") {
    let tmp = await getBlockHistory(docID, blockID)
    let historyContent = `
    <div class="protyle fn__flex-1">
        <div class="protyle-content" style="user-select: text;max-height: ${height};">
            <div class="protyle-wysiwyg protyle-wysiwyg--attr" style="
            padding: 10px 0px;
        ">
            <div class="backlinkList fn__flex-1"><ul class="b3-list b3-list--background">
            
                ${tmp}
            </ul>
            </div>
    
        </div>
    </div>`
    return historyContent
}


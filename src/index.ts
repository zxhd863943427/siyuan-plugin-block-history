import {
    Plugin,
    showMessage,
    Dialog,
    getFrontend,
    getBackend,
    IModel,
    adaptHotkey
} from "siyuan";
import "./index.scss";
import { i18n, setI18n } from "./utils"; 
import { getBlockHistoyDom, showHistory } from "./api";


const STORAGE_NAME = "menu-config";
const DOCK_TYPE = "block_history_dock";

export default class PluginSample extends Plugin {

    private customTab: () => IModel;
    private isMobile: boolean;

    async onload() {
        this.data[STORAGE_NAME] = {readonlyText: "Readonly"};
        setI18n(this.i18n)
        console.log("loading plugin-sample", this.i18n);

        const frontEnd = getFrontend();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";
        // 图标的制作参见帮助文档
        this.addIcons(`<symbol id="iconFace" viewBox="0 0 32 32">
<path d="M13.667 17.333c0 0.92-0.747 1.667-1.667 1.667s-1.667-0.747-1.667-1.667 0.747-1.667 1.667-1.667 1.667 0.747 1.667 1.667zM20 15.667c-0.92 0-1.667 0.747-1.667 1.667s0.747 1.667 1.667 1.667 1.667-0.747 1.667-1.667-0.747-1.667-1.667-1.667zM29.333 16c0 7.36-5.973 13.333-13.333 13.333s-13.333-5.973-13.333-13.333 5.973-13.333 13.333-13.333 13.333 5.973 13.333 13.333zM14.213 5.493c1.867 3.093 5.253 5.173 9.12 5.173 0.613 0 1.213-0.067 1.787-0.16-1.867-3.093-5.253-5.173-9.12-5.173-0.613 0-1.213 0.067-1.787 0.16zM5.893 12.627c2.28-1.293 4.040-3.4 4.88-5.92-2.28 1.293-4.040 3.4-4.88 5.92zM26.667 16c0-1.040-0.16-2.040-0.44-2.987-0.933 0.2-1.893 0.32-2.893 0.32-4.173 0-7.893-1.92-10.347-4.92-1.4 3.413-4.187 6.093-7.653 7.4 0.013 0.053 0 0.12 0 0.187 0 5.88 4.787 10.667 10.667 10.667s10.667-4.787 10.667-10.667z"></path>
</symbol>
<symbol id="iconSaving" viewBox="0 0 32 32">
<path d="M20 13.333c0-0.733 0.6-1.333 1.333-1.333s1.333 0.6 1.333 1.333c0 0.733-0.6 1.333-1.333 1.333s-1.333-0.6-1.333-1.333zM10.667 12h6.667v-2.667h-6.667v2.667zM29.333 10v9.293l-3.76 1.253-2.24 7.453h-7.333v-2.667h-2.667v2.667h-7.333c0 0-3.333-11.28-3.333-15.333s3.28-7.333 7.333-7.333h6.667c1.213-1.613 3.147-2.667 5.333-2.667 1.107 0 2 0.893 2 2 0 0.28-0.053 0.533-0.16 0.773-0.187 0.453-0.347 0.973-0.427 1.533l3.027 3.027h2.893zM26.667 12.667h-1.333l-4.667-4.667c0-0.867 0.12-1.72 0.347-2.547-1.293 0.333-2.347 1.293-2.787 2.547h-8.227c-2.573 0-4.667 2.093-4.667 4.667 0 2.507 1.627 8.867 2.68 12.667h2.653v-2.667h8v2.667h2.68l2.067-6.867 3.253-1.093v-4.707z"></path>
</symbol>
<symbol id="showHistory" lass="icon icon-tabler icon-tabler-clock-edit" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
<path d="M21 12a9 9 0 1 0 -9.972 8.948c.32 .034 .644 .052 .972 .052"></path>
<path d="M12 7v5l2 2"></path>
<path d="M18.42 15.61a2.1 2.1 0 0 1 2.97 2.97l-3.39 3.42h-3v-3l3.42 -3.39z"></path></symbol>`);
    this.addDock({
        config: {
            position: "LeftBottom",
            size: {width: 200, height: 0},
            icon: "showHistory",
            title: "show History",
        },
        data: {
            text: "This is my custom dock"
        },
        type: DOCK_TYPE,
        init() {
            this.element.innerHTML = `<div class="fn__flex-1 fn__flex-column">
    <div class="block__icons">
    <div class="block__logo">
        <svg><use xlink:href="#showHistory"></use></svg>
        Block History
    </div>
    <span class="fn__flex-1 fn__space"></span>
    <span data-type="min" class="block__icon b3-tooltips b3-tooltips__sw" aria-label="Min ${adaptHotkey("⌘W")}"><svg><use xlink:href="#iconMin"></use></svg></span>
    </div>
    <div class="fn__flex-1 plugin-block-hisory__custom-dock">
    </div>
    </div>`;
        },
        destroy() {
            console.log("destroy dock:", DOCK_TYPE);
        }
    });
        this.eventBus.on("click-blockicon", this.blockIconEvent);
        this.eventBus.on("click-editorcontent",this.dockEvent)

        console.log(this.i18n.helloPlugin);
    }

    onLayoutReady() {
        this.loadData(STORAGE_NAME);
        console.log(`frontend: ${getFrontend()}; backend: ${getBackend()}`);
    }

    onunload() {
        console.log(this.i18n.byePlugin);
        showMessage("Goodbye SiYuan Plugin");
        console.log("onunload");
    }
    that = this
    private dockEvent({detail}: any){
        setTimeout(()=>{
            const dock = document.querySelector(".fn__flex-1:not(.fn__none)>[data-type] .plugin-block-hisory__custom-dock")
            if(!dock) return;
            let docID = detail.protyle.block.id
            let blockID = detail.protyle.breadcrumb.id

            getBlockHistoyDom(docID, blockID,"unset").then(dom => {
                dock.innerHTML = dom
            }
        )},100)
    } 
    private blockIconEvent({detail}: any) {
        const ids: string[] = [];
        // console.log(detail)
        detail.blockElements.forEach((item: HTMLElement) => {
            ids.push(item.getAttribute("data-node-id"));
        });
        if (ids.length===0 || ids.length > 1) return;
        // console.log(ids[0], detail.protyle.block.parentID)
        let docID = detail.protyle.block.parentID
        let blockID = ids[0]
        detail.menu.addItem({
            icon: "showHistory",
            label: i18n.blockHistory,
            click:()=>{
                showMessage(i18n.loadingHistory,2000)
                showHistory(docID, blockID)}
        });
    }

    private showDialog() {
        let dialog = new Dialog({
            title: "Hello World",
            content: `<div id="helloPanel" class="b3-dialog__content"></div>`,
            width: this.isMobile ? "92vw" : "720px",
            destroyCallback(options) {
                //Destroy the component when the dialog is closed
                // hello.$destroy();
            },
        });
    }
}

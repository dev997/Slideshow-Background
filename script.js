import API from "./scripts/api.js";
import { registerSocket, sceneSocket } from "./scripts/socket.js";
import CONSTANTS from "./scripts/constants.js"

var count=0;
var isopen=false;
var interval;
var currentscene;
var settingsOpen=false;

let submitdata = {
    "name": "",
    "background.src": "",
}

let options = {
    fontColor: "#777777",
    fontSize: "28px",
    bgImg: "",
    bgPos: "center center",
    bgLoop: true,
    bgMuted: true,
    bgSize: "cover",
    bgColor: "#6e6e6e",
    bgOpacity: 0.7,
    fadeIn: 400,
    delay: 1500,
    fadeOut: 1000,
    scene: "",
}

Hooks.once("init", async () => {
    console.log(" Slideshow Background - initialized ");
    initHooks();
});

Hooks.once("ready", async () => {
    game.scenes.forEach((scene) =>{
        if(scene.flags[`slideshow-background`]?.slideshowEnabled===true){
            currentscene=scene;
        }
    });
    if(currentscene!=undefined){
        setLoop(function(){transitionBackground()}, currentscene.getFlag("slideshow-background", "slideshowTime"));
    };
})

export const initHooks = () => {
	Hooks.once("socketlib.ready", registerSocket);
	registerSocket();
};

Hooks.on("renderSceneConfig", (app, html) =>{
    settingsOpen=true;
    isopen = true;
    const activeTab = html.find(".tab.active");

    //Create new elements to be injected into menu
    var container = document.createElement("div");
    var boxlabel = document.createElement("label");
    var checkbox = document.createElement("input");
    var timecontainer = document.createElement("div");
    var timelabel = document.createElement("label");
    var timeinput = document.createElement("input");

    //Set new elements attributes
    //---------------------------------
    container.setAttribute("class", "form-group");
    timecontainer.setAttribute("class", "form-group");
    
    timeinput.setAttribute("class", "time-input");
    timeinput.setAttribute("type", "number");
    timeinput.setAttribute("value", app.object.getFlag("slideshow-background", "slideshowTime"));
    
    timelabel.innerHTML = "Time between transition(ms)";

    boxlabel.innerHTML = "Slideshow background enabled";
    checkbox.setAttribute("type", "checkbox");
    checkbox.setAttribute("class", "slideshowEnabled");
    checkbox.checked = app.object.getFlag("slideshow-background", "slideshowEnabled"); //Saves checkbox state
    //---------------------------------

    //Format elements
    container.appendChild(boxlabel);
    container.appendChild(checkbox);
    
    timecontainer.appendChild(timelabel);
    timecontainer.appendChild(timeinput);

    //Inject new elements
    activeTab.after(timecontainer);
    activeTab.after(container);
})

Hooks.on("closeSceneConfig", (app, html) =>{
    settingsOpen=false;
    let time = Number(html.find(".time-input")[0].value);
    let enabled = html.find(".slideshowEnabled")[0];
    if(enabled.checked === true){
        //Check there is not a slideshow set up already
        if(currentscene!=undefined && currentscene!=app.object){
            ui.notifications.warn("A scene is already set as a slideshow");
            return;
        }
        options.bgColor=app.object.backgroundColor;
        currentscene = app.object;
        app.object.setFlag("slideshow-background", "slideshowEnabled", true);
        app.object.setFlag("slideshow-background", "slideshowTime", time);
        setLoop(function(){transitionBackground()}, time==undefined?30000:time);
    }else{
        app.object.setFlag("slideshow-background", "slideshowEnabled", false);
    }
})

function transitionBackground(){
    if(!game.user?.isGM || settingsOpen){
        return;
    }
    var scenes = game.scenes.contents.filter((scene) => {
        return scene.flags[`slideshow-background`]?.slideshowEnabled===true;
    })

    if(scenes.length<1){
        return;
    }

    //Filter out picture names
    var pictureNames = game.journal.contents.find(function(entry){
        return entry.name === "slideshow";
    }).pages.find(function(page){
        return page.name === "slideshow-page";
    }).text.content;
    
    var filteredNames = pictureNames.match(/".*?"/g);

    try{
        scenes.forEach(scene => {
            options.scene=scene;
            sceneSocket.executeForEveryone("executeAction", options);

            setTimeout(function(){
                scene.background.src = filteredNames[count].replaceAll('"', '');
                console.log("Updating scene...");
                let id = scene._id;
                console.log(submitdata);
                submitdata["background.src"] = filteredNames[count].replaceAll('"', '');
                submitdata["name"] = scene.name;
                scene.update(submitdata);
                count++;
            }, 1000);
            
        });
    }catch(e){
        console.log(e);
    }
    
    if(count>filteredNames.length-1){
        count=0;
    }
}

function setLoop(callback, timer){
    clearInterval(interval);
    interval = setInterval(callback, timer);
};

export function fade(options){
    let viewingscene=false;
    game.scenes.forEach( (scene) => {
        if(scene._view && scene._id == options.scene._id){
            viewingscene=true;
        }
    })
    if(viewingscene){
        //HTML Inject
        //----------------------------------------
        $("body").append(
            `<div id="scene-transitions" class="scene-transitions">
                <div class="scene-transitions-bg">
                </div>
                <div class="scene-transitions-content">
                </div>
            </div>`
        );
        //----------------------------------------

        //CSS transition
        //----------------------------------------
        $("#scene-transitions").css({
            backgroundColor: options.bgColor,
            zIndex: 1,
        });

        $("#scene-transitions").find(".scene-transitions-bg").css({
            backgroundImage: 'url("")',
            opacity: options.bgOpacity,
            backgroundSize: options.bgSize,
            backgroundPosition: options.bgPos,
        });

        $("#scene-transitions")
            .find(".scene-transitions-content")
            .css({ color: options.fontColor, fontSize: options.fontSize, zIndex: 5000 })
            .html("");

        $("#scene-transitions").fadeIn(options.fadeIn, () => {
            $("#scene-transitions")?.find(".scene-transitions-content").fadeIn();
        });

        setTimeout(function(){
            $("#scene-transitions")?.fadeOut(options.fadeOut, () => {
                $("#scene-transitions")?.remove();
            });
        }, options.delay)
        //----------------------------------------
    }
}

/**
 * Initialization helper, to set Socket.
 * @param socket to set to game module.
 */
export function setSocket(socket) {
	const data = game.modules.get(CONSTANTS.MODULE_NAME);
	data.socket = socket;
}
/*
 * Returns the set socket.
 * @returns Socket from games module.
 */
export function getSocket() {
	const data = game.modules.get(CONSTANTS.MODULE_NAME);
	return data.socket;
}
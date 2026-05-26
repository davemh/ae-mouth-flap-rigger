//////////////////////////////////////////////////
//                                              //
//  AE Mouth Flap Rigger v1.3.0                 //
//                                              //
//////////////////////////////////////////////////
//         _                           _        //
//    by  | |                         | |       //
//      __| | __ ___   _____ _ __ ___ | |__     //
//     / _` |/ _` \ \ / / _ \ '_ ` _ \| '_ \    //
//    | (_| | (_| |\ V /  __/ | | | | | | | |   //
//     \__,_|\__,_| \_/ \___|_| |_| |_|_| |_|   //
//                                              //
//////////////////////////////////////////////////
//                                              //
//  Script for quickly building a mouth flap    //
//  rig in After Effects. Creates a null        //
//  controller with a slider to toggle between  //
//  mouth open and closed states. Two layers    //
//  required: one drawing (or pose) of an open  //
//  mouth, and one of a closed mouth.           //
//                                              //
//  1. Place mouth-open and mouth-closed        //
//     image files or poses in precomps         //
//     into the same comp where you want        //
//     your controller null.                    //
//                                              //
//  2. Select mouth-open layer.                 //
//                                              //
//  3. Select mouth-closed layer.               //
//                                              //
//  4. Enter a character name -- this will      //
//     append the null's name without           //
//     "_charactername", making it possible     //
//     to use the script to create multiple     //
//     rigs inside of the same comp.            //
//                                              //
//  5. Click button to generate rig.            //
//                                              //
//  6. Keyframe mouth shape via hold keyframes  //
//     on the Slider. 0 = open. 1 = closed.     //
//                                              //
//////////////////////////////////////////////////

{
    function escapeForExpression(str) {
        return str.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\"/g, '\\\"');
    }

    function getSelectedLayer() {
        if (app.project.activeItem && app.project.activeItem instanceof CompItem) {
            var comp = app.project.activeItem;
            if (comp.selectedLayers.length === 1) {
                return comp.selectedLayers[0];
            }
            if (comp.selectedLayers.length === 0) {
                alert("Please select one layer in the composition first.");
            } else {
                alert("Please select only one layer for this selection.");
            }
        } else {
            alert("Please select a composition first.");
        }
        return null;
    }

    // Create main window as a modeless palette so AE comp selection remains available
    var win = new Window("palette", "Mouth Control Setup");
    win.orientation = "column";
    win.alignChildren = "fill";

    win.add("statictext", undefined, "Select your mouth layers and enter character name");

    var layerGroup = win.add("group");
    layerGroup.orientation = "column";
    layerGroup.alignChildren = "left";
    layerGroup.add("statictext", undefined, "Selected Layers:");

    var mouthOpenText = layerGroup.add("statictext", undefined, "Mouth Open: [Not Selected]");
    var mouthClosedText = layerGroup.add("statictext", undefined, "Mouth Closed: [Not Selected]");

    var buttonGroup = win.add("group");
    buttonGroup.orientation = "row";
    buttonGroup.alignChildren = "fill";
    var selectOpenBtn = buttonGroup.add("button", undefined, "Select Mouth Open Layer");
    var selectClosedBtn = buttonGroup.add("button", undefined, "Select Mouth Closed Layer");

    var charGroup = win.add("group");
    charGroup.add("statictext", undefined, "Character Name:");
    var charInput = charGroup.add("edittext", undefined, "");
    charInput.characters = 20;

    var okCancelGroup = win.add("group");
    okCancelGroup.orientation = "row";
    var okBtn = okCancelGroup.add("button", undefined, "OK");
    var cancelBtn = okCancelGroup.add("button", undefined, "Cancel");

    var mouthOpenLayer = null;
    var mouthClosedLayer = null;

    function updateLayerText() {
        mouthOpenText.text = "Mouth Open: " + (mouthOpenLayer ? mouthOpenLayer.name : "[Not Selected]");
        mouthClosedText.text = "Mouth Closed: " + (mouthClosedLayer ? mouthClosedLayer.name : "[Not Selected]");
        win.layout.layout(true);
    }

    selectOpenBtn.onClick = function() {
        mouthOpenLayer = getSelectedLayer();
        updateLayerText();
    };

    selectClosedBtn.onClick = function() {
        mouthClosedLayer = getSelectedLayer();
        updateLayerText();
    };

    okBtn.onClick = function() {
        if (!mouthOpenLayer) {
            alert("Select Mouth Open layer.");
            return;
        }
        if (!mouthClosedLayer) {
            alert("Select Mouth Closed layer.");
            return;
        }
        if (mouthOpenLayer === mouthClosedLayer) {
            alert("Mouth Open and Mouth Closed layers must be different.");
            return;
        }
        var charName = charInput.text.trim();
        if (charName == "") {
            alert("Character Name.");
            return;
        }

        var comp = app.project.activeItem;
        if (!(comp && comp instanceof CompItem)) {
            alert("Please select a composition first.");
            return;
        }

        app.beginUndoGroup("Mouth Control Setup");

        var nullLayer = comp.layers.addNull();
        nullLayer.name = "Mouth_CTRL_" + charName;

        var sliderEffect = nullLayer.Effects.addProperty("ADBE Slider Control");
        sliderEffect.name = "MouthIndex";
        sliderEffect("Slider").setValue(1);

        var controllerName = "Mouth_CTRL_" + charName;
        var exprControllerName = escapeForExpression(controllerName);

        var mouthOpenOpacity = mouthOpenLayer.opacity;
        mouthOpenOpacity.expression = "idx = thisComp.layer('" + exprControllerName + "').effect('MouthIndex')('Slider');\n(Math.round(idx) == 0) ? 100 : 0";

        var mouthClosedOpacity = mouthClosedLayer.opacity;
        mouthClosedOpacity.expression = "idx = thisComp.layer('" + exprControllerName + "').effect('MouthIndex')('Slider');\n(Math.round(idx) == 1) ? 100 : 0";

        app.endUndoGroup();

        alert("Mouth Flap rigging complete!\n\nNull Controller: " + nullLayer.name + "\nSlider: MouthIndex\n\nDefault: Mouth Closed (slider at 1)");
        win.close();
    };

    cancelBtn.onClick = function() {
        win.close();
    };

    win.center();
    win.show();
}

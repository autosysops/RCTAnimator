/*
Animation Structure
{
    Animations: [
        {
            Id: 0,
            Name: Name,
            Version: 3,
            CurrentFrame: 0,
            Active: true,
            Frames: [
                {
                    Id: 0,
                    Name: Name,
                    Delay: 100 <Ticks>,
                    MoveCamera: false,
                    MoveX: 0,
                    MoveY: 0,
                    MoveRotation: 0,
                    MoveZoom: 0,
                    Elements: [
                        {
                            Id: 0,
                            Name: name,
                            TileX: 1,
                            TileY: 1,
                            ElementType: "small_scenery",
                            ElementIdentifier1: "",
                            ElementIdentifier2: "",
                            ElementIdentifier3: "",
                            ElementIdentifier4: "",
                            ElementIdentifier5: "",
                            ElementQuadrants: 8,
                            ElementHeight: 14,
                            ElementDirection: 1,
                            ElementHidden: false,
                            ElementPrimaryColour: 1,
                            ElementSecondaryColour: 1,
                            ElementTertiaryColour: 1,
                            Action: {
                                RaiseLower = true
                                Offset = 2,
                                Recolour = true,
                                PrimaryColour = 1,
                                SecondaryColour = 1,
                                TertiaryColour = 1,
                                HideShow = true,
                                Hidden = false,
                                Rotate = true,
                                RotateBy = 1
                            }
                        }
                    ],
                    Cars: [
                        {
                            Id: 0,
                            Name: name,
                            CarRide: 2,
                            CarTrain: 0,
                            CarTrainCar: 0,
                            CarVariantType: 0,
                            CarVehicle: 0
                            Action: {
                                RaiseLower = true,
                                Offset = 2,
                                Recolour = true,
                                BodyColour = 1,
                                TrimColour = 1,
                                TertiaryColour = 1,
                                ChangeVariant = true,
                                VariantType = 0,
                                ChangeVehicle = true,
                                VehicleObject = 0,
                                TravelBy: false,
                                TravelDistance: 10000
                            }
                        }
                    ]
                }
            ],
            Triggers: [
                {
                    Id: 0,
                    Name: Name,
                    Type: Continues,
                    ContinuesStartDelay: 1,
                    ButtonName: Name,
                    ButtonPos: 1,
                    ButtonExclusive: true,
                    ButtonKeepPressed: true,
                    CarOnTrackX: 0,
                    CarOnTrackY: 0,
                    CarOnTrackZ: 0,
                    CarOnTrackD: 0,
                    CarOnTrackRide: 0,
                    CarOnTrackTrain: 0,
                    CarOnTrackCar: 0,
                    FramesToPlay: 2
                }
            ]
        }
    ]
}
*/

// Global vars
var supportedversions = [1]
var supportedtriggers = ["none", "continues", "button", "carOnTrack"]
var currentversion = 2
var mainwindowoldx = 0
var allowsave = true;
var objectdata = {
    surface: {
        supportedactions: ["RaiseLower"],
        identifiers: ["surfaceStyle"],
        objecttype: ["terrain_surface"],
        prefix: "[L] "
    },
    footpath: {
        supportedactions: ["RaiseLower", "HideShow"],
        identifiers: ["isQueue", "surfaceObject", "railingsObject", "object"],
        objecttype: ["footpath", "footpath", "footpath", "footpath"],
        prefix: "[P] "
    },
    track: {
        supportedactions: ["RaiseLower", "HideShow", "Rotate"],
        identifiers: ["ride"],
        objecttype: ["ride"],
        prefix: "[T] "
    },
    small_scenery: {
        supportedactions: ["RaiseLower", "Recolour", "HideShow", "Rotate"],
        identifiers: ["object"],
        objecttype: ["small_scenery"],
        prefix: ""
    },
    wall: {
        supportedactions: ["RaiseLower", "Recolour", "HideShow", "Rotate"],
        identifiers: ["object"],
        objecttype: ["wall"],
        prefix: ""
    },
    entrance: {
        supportedactions: ["RaiseLower", "HideShow", "Rotate"],
        identifiers: ["object", "ride"],
        objecttype: ["station", "ride"],
        prefix: ""
    },
    large_scenery: {
        supportedactions: ["RaiseLower", "Recolour", "HideShow", "Rotate"],
        identifiers: ["object"],
        objecttype: ["large_scenery"],
        prefix: ""
    },
    banner: {
        supportedactions: ["RaiseLower", "Recolour", "HideShow", "Rotate"],
        identifiers: ["object"],
        objecttype: ["banner"],
        prefix: ""
    }
}
var identifieralias = {
    surfaceStyle: "ElementIdentifier1",
    object: "ElementIdentifier1",
    ride: "ElementIdentifier2",
    surfaceObject: "ElementIdentifier3",
    railingsObject: "ElementIdentifier4",
    isQueue: "ElementIdentifier5"
}


// Shared Functions
function getAnimations() {
    var animations = context.getParkStorage('Levis.Animations').get('animations');
    if (!animations || animations == null) {
        animations = {
            Animations: []
        }
    }
    return animations
}

function getAnimationById(id) {
    var animations = getAnimations();

    for (var i = 0; i < animations.Animations.length; i++) {
        if (animations.Animations[i].Id == id) {
            return animations.Animations[i];
        }
    }
}

function validateAnimations(animations) {
    for (var i = 0; i < animations.Animations.length; i++) {
        if (!supportedversions.includes(animations.Animations[i].Version)) {
            return ("Animation " + animations.Animations[i].Name + " is not supported in this version of the plugin, please update the plugin.")
        }
    }

    return true
}

function getMapElementId(element) {
    // Get all the elements on the map tile
    var mapelements = map.getTile(element.TileX, element.TileY).elements;
    var mapelement = null
    for (var i = 0; i < mapelements.length; i++) {
        mapelement = mapelements[i]
        // Check for the identifiers
        var foundmatch = false
        for (var j = 0; j < objectdata[mapelement.type].identifiers.length; j++) {
            if (mapelement[objectdata[mapelement.type].identifiers[j]] == element[identifieralias[objectdata[mapelement.type].identifiers[j]]]) {
                foundmatch = true
                break
            }
        }
        // Check if any identifier matched with the map element
        if (!foundmatch) {
            continue
        }

        // Check Height
        if (mapelement.baseHeight != element.ElementHeight) {
            continue
        }
        // Check Quadrants
        if (mapelement.occupiedQuadrants != element.ElementQuadrants) {
            continue
        }
        // Check Direction
        if (mapelement.direction != element.ElementDirection) {
            continue
        }
        // Check Hidden
        if (mapelement.isHidden != element.ElementHidden) {
            continue
        }
        // Check PrimaryColour
        if (mapelement.primaryColour != element.ElementPrimaryColour) {
            continue
        }
        // Check SecondaryColour
        if (mapelement.secondaryColour != element.ElementSecondaryColour) {
            continue
        }
        // Check TertiaryColour
        if (mapelement.tertiaryColour != element.ElementTertiaryColour) {
            continue
        }
        // Found it
        return i
    }
}

function getCarId(car) {
    // Get all the cars on the map
    var mapcars = map.getAllEntities("car");
    var mapcar = null
    var traininfo

    for (var i = 0; i < mapcars.length; i++) {
        mapcar = mapcars[i]
        // Check Ride
        if (mapcar.ride != car.CarRide) {
            continue
        }

        // Get the train info for the entity
        traininfo = getCarTrainInfo(mapcar.id)

        // Check Train
        if (traininfo.train != car.CarTrain) {
            continue
        }

        // Check Car
        if (traininfo.car != car.CarTrainCar) {
            continue
        }

        // Found it
        return mapcar.id
    }

    return null
}

function getCarTrainInfo(carEntityId) {
    try {
        var entity = map.getEntity(carEntityId);
    }
    catch (e) {
        return {
            ride: null,
            train: null,
            car: null
        }
    }

    // Loop through all vehicles
    var ride = map.getRide(entity.ride)
    for (var j = 0; j < (ride.vehicles.length - 1); j++) {
        if (entity.id < ride.vehicles[j + 1]) {
            // Train found so break loop
            break;
        }
    }

    // If the entity ID's aren't the same then check the next cars
    var carId = ride.vehicles[j]
    var carEntity
    var carNum = 0
    while (carId != carEntityId) {
        try{
        carEntity = map.getEntity(carId)
        }
        catch(e) {
            carNum = null
            break
        }
        if (carEntity.nextCarOnTrain) {
            carId = carEntity.nextCarOnTrain
            carNum++
        }
        else {
            carNum = null
            break
        }
    }

    return {
        ride: entity.ride,
        train: j,
        car: carNum
    }
}

// Manager functions

function getTriggerbyId(animationid, triggerid) {
    var animation = getAnimationById(animationid);

    for (var i = 0; i < animation.Triggers.length; i++) {
        if (animation.Triggers[i].Id == triggerid) {
            return animation.Triggers[i];
        }
    }
}

function getFramebyId(animationid, frameid) {
    var animation = getAnimationById(animationid);

    for (var i = 0; i < animation.Frames.length; i++) {
        if (animation.Frames[i].Id == frameid) {
            return animation.Frames[i];
        }
    }
}

function getObjectbyId(animationid, frameid, elementid) {
    var animation = getAnimationById(animationid);

    for (var i = 0; i < animation.Frames[frameid].Elements.length; i++) {
        if (animation.Frames[frameid].Elements[i].Id == elementid) {
            return animation.Frames[frameid].Elements[i];
        }
    }
}

function getMainWindow() {
    return ui.getWindow("RctAnimationManager")
}

function hideMainWindow() {
    var window = getMainWindow();
    mainwindowoldx = window.x;
    window.x = -1000;
}

function restoreMainWindow() {
    getMainWindow().x = mainwindowoldx;
}

function getTriggerWindow() {
    return ui.getWindow("RctAnimationManagerTriggerEdit")
}

function getFrameWindow() {
    return ui.getWindow("RctAnimationManagerFrameEdit")
}

function getTileWindow() {
    return ui.getWindow("RctAnimationManagerTileEdit")
}

function getProgressWindow() {
    return ui.getWindow("RctAnimationManagerProgress")
}

function triggerwindowSetTriggerSettings() {
    // Set everything hidden
    getTriggerWindow().findWidget("TriggerButtonNameTextBox").isVisible = false
    getTriggerWindow().findWidget("TriggerButtonPosTextBox").isVisible = false
    getTriggerWindow().findWidget("TriggerButtonExclusiveCheckbox").isVisible = false
    getTriggerWindow().findWidget("TriggerButtonExclusiveLabel").isVisible = false
    getTriggerWindow().findWidget("TriggerButtonKeepPressedLabel").isVisible = false
    getTriggerWindow().findWidget("TriggerButtonKeepPressedCheckbox").isVisible = false
    getTriggerWindow().findWidget("TriggerButtonPosLabel").isVisible = false
    getTriggerWindow().findWidget("TriggerButtonNameLabel").isVisible = false
    getTriggerWindow().findWidget("TriggerButtonFramesLabel").isVisible = false
    getTriggerWindow().findWidget("TriggerButtonFramesTextBox").isVisible = false
    getTriggerWindow().findWidget("TriggerContinuesStartLabel").isVisible = false
    getTriggerWindow().findWidget("TriggerContinuesStartTextBox").isVisible = false
    getTriggerWindow().findWidget("TriggerCarOnTrackXYLabel").isVisible = false
    getTriggerWindow().findWidget("TriggerCarOnTrackZDLabel").isVisible = false
    getTriggerWindow().findWidget("TriggerCarOnTrackEyeDropper").isVisible = false
    getTriggerWindow().findWidget("TriggerCarOnTrackTrainLabel").isVisible = false
    getTriggerWindow().findWidget("TriggerCarOnTrackCarLabel").isVisible = false
    getTriggerWindow().findWidget("TriggerCarOnTrackEyeDropperCar").isVisible = false
    getTriggerWindow().findWidget("TriggerCarOnTrackXTextBox").isVisible = false
    getTriggerWindow().findWidget("TriggerCarOnTrackYTextBox").isVisible = false
    getTriggerWindow().findWidget("TriggerCarOnTrackZTextBox").isVisible = false
    getTriggerWindow().findWidget("TriggerCarOnTrackDTextBox").isVisible = false
    getTriggerWindow().findWidget("TriggerCarOnTrackTrainTextBox").isVisible = false
    getTriggerWindow().findWidget("TriggerCarOnTrackCarTextBox").isVisible = false
    getTriggerWindow().findWidget("TriggerCarOnTrackFramesLabel").isVisible = false
    getTriggerWindow().findWidget("TriggerCarOnTrackFramesTextBox").isVisible = false
    getTriggerWindow().findWidget("TriggerCarOnTrackRideTextBox").isVisible = false
    getTriggerWindow().findWidget("TriggerCarOnTrackRideLabel").isVisible = false

    // Set the continues options
    if (supportedtriggers[getTriggerWindow().findWidget("triggerTypeDropDown").selectedIndex] == "continues") {
        getTriggerWindow().findWidget("TriggerContinuesStartLabel").isVisible = true
        getTriggerWindow().findWidget("TriggerContinuesStartTextBox").isVisible = true
    }

    // Set the button options
    if (supportedtriggers[getTriggerWindow().findWidget("triggerTypeDropDown").selectedIndex] == "button") {
        getTriggerWindow().findWidget("TriggerButtonNameTextBox").isVisible = true
        getTriggerWindow().findWidget("TriggerButtonPosTextBox").isVisible = true
        getTriggerWindow().findWidget("TriggerButtonExclusiveCheckbox").isVisible = true
        getTriggerWindow().findWidget("TriggerButtonExclusiveLabel").isVisible = true
        getTriggerWindow().findWidget("TriggerButtonKeepPressedLabel").isVisible = true
        getTriggerWindow().findWidget("TriggerButtonKeepPressedCheckbox").isVisible = true
        getTriggerWindow().findWidget("TriggerButtonPosLabel").isVisible = true
        getTriggerWindow().findWidget("TriggerButtonNameLabel").isVisible = true
        getTriggerWindow().findWidget("TriggerButtonFramesLabel").isVisible = true
        getTriggerWindow().findWidget("TriggerButtonFramesTextBox").isVisible = true
    }

    // Set the carOnTrack options
    if (supportedtriggers[getTriggerWindow().findWidget("triggerTypeDropDown").selectedIndex] == "carOnTrack") {
        getTriggerWindow().findWidget("TriggerCarOnTrackXYLabel").isVisible = true
        getTriggerWindow().findWidget("TriggerCarOnTrackZDLabel").isVisible = true
        getTriggerWindow().findWidget("TriggerCarOnTrackEyeDropper").isVisible = true
        getTriggerWindow().findWidget("TriggerCarOnTrackTrainLabel").isVisible = true
        getTriggerWindow().findWidget("TriggerCarOnTrackCarLabel").isVisible = true
        getTriggerWindow().findWidget("TriggerCarOnTrackEyeDropperCar").isVisible = true
        getTriggerWindow().findWidget("TriggerCarOnTrackXTextBox").isVisible = true
        getTriggerWindow().findWidget("TriggerCarOnTrackYTextBox").isVisible = true
        getTriggerWindow().findWidget("TriggerCarOnTrackZTextBox").isVisible = true
        getTriggerWindow().findWidget("TriggerCarOnTrackDTextBox").isVisible = true
        getTriggerWindow().findWidget("TriggerCarOnTrackTrainTextBox").isVisible = true
        getTriggerWindow().findWidget("TriggerCarOnTrackCarTextBox").isVisible = true
        getTriggerWindow().findWidget("TriggerCarOnTrackFramesLabel").isVisible = true
        getTriggerWindow().findWidget("TriggerCarOnTrackFramesTextBox").isVisible = true
        getTriggerWindow().findWidget("TriggerCarOnTrackRideTextBox").isVisible = true
        getTriggerWindow().findWidget("TriggerCarOnTrackRideLabel").isVisible = true
    }
}

function mainWindowSetAnimationList() {
    getMainWindow().findWidget("animations").items = getAnimations().Animations.map(function (animation) {
        var active = "No"
        if (animation.Active) {
            active = "Yes"
        }
        return [animation.Id.toString(), animation.Name, active, animation.CurrentFrame.toString()];
    })
}

function mainWindowSetTriggerList(animation) {
    var triggerlist = getMainWindow().findWidget("triggerlist")
    triggerlist.items = animation.Triggers.map(function (trigger) {
        return [trigger.Id.toString(), trigger.Name, trigger.Type];
    })
}

function mainWindowSetFrameList(animation) {
    var framelist = getMainWindow().findWidget("framelist")
    framelist.items = animation.Frames.map(function (frame) {
        return [frame.Id.toString(), frame.Name, frame.Delay.toString()];
    })
}

function frameWindowObjectList(frame) {
    var objectlist = getFrameWindow().findWidget("objectlist")
    if (objectlist) {
        objectlist.items = frame.Elements.map(function (element) {
            return [element.Id.toString(), element.TileX.toString(), element.TileY.toString(), element.ElementHeight.toString(), element.Name];
        })
    }
}

function tileWindowObjectList(tileX1, tileX2, tileY1, tileY2) {
    // Get filter values
    var zlow = Number(getTileWindow().findWidget("filterZlower").text);
    var zup = Number(getTileWindow().findWidget("filterZupper").text);

    // Generate the list of objects on these coords
    var list = [];
    var elements = null;
    var vis = "Yes";
    var element = null;
    for (var x = tileX1; x <= tileX2; x++) {
        for (var y = tileY1; y <= tileY2; y++) {
            elements = map.getTile(x, y).elements
            for (var i = 0; i < elements.length; i++) {
                // Get the element
                var element = elements[i];

                // Check if the element is within the Z filter
                if (element.baseHeight < zlow) { continue }
                if (element.baseHeight > zup) { continue }

                // Check if the element type is filtered
                if (element.type == "surface") { if (getTileWindow().findWidget("filterSurfaceCheckbox").isChecked) { continue } }
                if (element.type == "footpath") { if (getTileWindow().findWidget("filterFootpathCheckbox").isChecked) { continue } }
                if (element.type == "track") { if (getTileWindow().findWidget("filterTrackCheckbox").isChecked) { continue } }
                if (element.type == "small_scenery") { if (getTileWindow().findWidget("filterSmallSceneryCheckbox").isChecked) { continue } }
                if (element.type == "wall") { if (getTileWindow().findWidget("filterWallCheckbox").isChecked) { continue } }
                if (element.type == "entrance") { if (getTileWindow().findWidget("filterEntranceCheckbox").isChecked) { continue } }
                if (element.type == "large_scenery") { if (getTileWindow().findWidget("filterLargeSceneryCheckbox").isChecked) { continue } }
                if (element.type == "banner") { if (getTileWindow().findWidget("filterBannerCheckbox").isChecked) { continue } }

                // Check if the element is hidden while the filter is active
                if (getTileWindow().findWidget("filterVisible").selectedIndex == 1 && element.isHidden == true) { continue }
                if (getTileWindow().findWidget("filterVisible").selectedIndex == 2 && element.isHidden == false) { continue }

                // Add the element to the list
                var vis = "Yes";
                if (element.isHidden) {
                    vis = "No"
                }
                list.push([vis, x.toString(), y.toString(), element.baseHeight.toString(), i.toString(), getObjectName(element)])
            }
        }
    }
    // Add the objects to the objectlist
    getTileWindow().findWidget("objectlist").items = list
}

function frameWindowCarList(frame) {
    var carlist = getFrameWindow().findWidget("carlist")
    if (carlist) {
        carlist.items = frame.Cars.map(function (car) {
            return [car.Id.toString(), car.Name];
        })
    }
}

function mainWindowSetAnimationInfo(animation) {
    // Set the name
    var name = getMainWindow().findWidget("AnimationNameTextBox");
    name.isDisabled = false
    name.text = animation.Name
    // Set the active state
    var active = getMainWindow().findWidget("AnimationActionCheckBox");
    active.isDisabled = false
    active.isChecked = animation.Active
    // Enable the update button
    getMainWindow().findWidget("SaveAnimationInfo").isDisabled = false;
    // Enable delete button
    getMainWindow().findWidget("DeleteAnimation").isDisabled = false;

    // Update the framelist
    mainWindowSetFrameList(animation);
    // Update the triggerlist
    mainWindowSetTriggerList(animation);
    // Update the current frame
    getMainWindow().findWidget("currentFrameSpinner").text = animation.CurrentFrame.toString()

    // Only Enable controls if animation is not active.
    if (!animation.Active) {
        getMainWindow().findWidget("triggerlist").isDisabled = false;
        getMainWindow().findWidget("framelist").isDisabled = false;
        // Enable Trigger controls
        getMainWindow().findWidget("AddTriggerButton").isDisabled = false;
        getMainWindow().findWidget("EditTriggerButton").isDisabled = false;
        getMainWindow().findWidget("DeleteTriggerButton").isDisabled = false;
        // Enable the Frame controls
        getMainWindow().findWidget("AddFrameButton").isDisabled = false;
        getMainWindow().findWidget("GenFrameButton").isDisabled = false;
        getMainWindow().findWidget("EditFrameButton").isDisabled = false;
        getMainWindow().findWidget("DeleteFrameButton").isDisabled = false;
        getMainWindow().findWidget("currentFrameSpinner").isDisabled = false;
    }
    else {
        getMainWindow().findWidget("triggerlist").isDisabled = true;
        getMainWindow().findWidget("framelist").isDisabled = true;
        // Enable Trigger controls
        getMainWindow().findWidget("AddTriggerButton").isDisabled = true;
        getMainWindow().findWidget("EditTriggerButton").isDisabled = true;
        getMainWindow().findWidget("DeleteTriggerButton").isDisabled = true;
        // Enable the Frame controls
        getMainWindow().findWidget("AddFrameButton").isDisabled = true;
        getMainWindow().findWidget("GenFrameButton").isDisabled = true;
        getMainWindow().findWidget("EditFrameButton").isDisabled = true;
        getMainWindow().findWidget("DeleteFrameButton").isDisabled = true;
        getMainWindow().findWidget("currentFrameSpinner").isDisabled = true;
    }
}

function frameWindowSetObjectInfo(element) {
    // Disable saving of the object
    allowsave = false;

    //Set raise/lower
    var uielement = null;
    if (objectdata[element.ElementType].supportedactions.indexOf("RaiseLower") >= 0) {
        uielement = getFrameWindow().findWidget("objectActionRaiseLowerCheckBox");
        uielement.isDisabled = false;
        uielement.isChecked = element.Action.RaiseLower

        uielement = getFrameWindow().findWidget("objectActionRaiseLowerSpinner");
        uielement.isDisabled = false;
        uielement.text = (element.Action.Offset / 2) + " Units"
    }
    else {
        uielement = getFrameWindow().findWidget("objectActionRaiseLowerCheckBox");
        uielement.isDisabled = true;
        uielement.isChecked = false

        uielement = getFrameWindow().findWidget("objectActionRaiseLowerSpinner");
        uielement.isDisabled = true;
        uielement.text = "0 Units"
    }

    //Set recolour
    if (objectdata[element.ElementType].supportedactions.indexOf("Recolour") >= 0) {
        uielement = getFrameWindow().findWidget("objectActionRecolourCheckBox");
        uielement.isDisabled = false;
        uielement.isChecked = element.Action.Recolour

        uielement = getFrameWindow().findWidget("objectActionRecolourPicker1");
        uielement.isDisabled = false;
        uielement.colour = element.Action.PrimaryColour

        uielement = getFrameWindow().findWidget("objectActionRecolourPicker2");
        uielement.isDisabled = false;
        uielement.colour = element.Action.SecondaryColour

        uielement = getFrameWindow().findWidget("objectActionRecolourPicker3");
        uielement.isDisabled = false;
        uielement.colour = element.Action.TertiaryColour
    }
    else {
        uielement = getFrameWindow().findWidget("objectActionRecolourCheckBox");
        uielement.isDisabled = true;
        uielement.isChecked = false

        uielement = getFrameWindow().findWidget("objectActionRecolourPicker1");
        uielement.isDisabled = true;
        uielement.colour = 0

        uielement = getFrameWindow().findWidget("objectActionRecolourPicker2");
        uielement.isDisabled = true;
        uielement.colour = 0

        uielement = getFrameWindow().findWidget("objectActionRecolourPicker3");
        uielement.isDisabled = true;
        uielement.colour = 0
    }

    //Set Hide
    if (objectdata[element.ElementType].supportedactions.indexOf("HideShow") >= 0) {
        uielement = getFrameWindow().findWidget("objectActionHideCheckBox");
        uielement.isDisabled = false;
        uielement.isChecked = element.Action.HideShow

        uielement = getFrameWindow().findWidget("objectActionHideCheckBoxValue");
        uielement.isDisabled = false;
        uielement.isChecked = element.Action.Hidden
    }
    else {
        uielement = getFrameWindow().findWidget("objectActionHideCheckBox");
        uielement.isDisabled = true;
        uielement.isChecked = false

        uielement = getFrameWindow().findWidget("objectActionHideCheckBoxValue");
        uielement.isDisabled = true;
        uielement.isChecked = false
    }

    // Set Rotate
    if (objectdata[element.ElementType].supportedactions.indexOf("Rotate") >= 0) {
        uielement = getFrameWindow().findWidget("objectActionRotateCheckBox");
        uielement.isDisabled = false;
        uielement.isChecked = element.Action.Rotate

        uielement = getFrameWindow().findWidget("objectActionRotateSpinner");
        uielement.isDisabled = false;
        uielement.text = element.Action.RotateBy.toString()
    }
    else {
        uielement = getFrameWindow().findWidget("objectActionRotateCheckBox");
        uielement.isDisabled = true;
        uielement.isChecked = false

        uielement = getFrameWindow().findWidget("objectActionRotateSpinner");
        uielement.isDisabled = true;
        uielement.text = "0"
    }

    // Enable apply to all
    if (objectdata[element.ElementType].supportedactions.length > 0) {
        uielement = getFrameWindow().findWidget("applyAllObjects");
        uielement.isDisabled = false;
    }
    else {
        uielement = getFrameWindow().findWidget("applyAllObjects");
        uielement.isDisabled = true;
    }

    // Enable saving again
    allowsave = true
}

function frameWindowSetCarInfo(car) {
    // Disable saving of the object
    allowsave = false;
    //Set raise/lower
    var uielement = null;
    uielement = getFrameWindow().findWidget("carActionRaiseLowerCheckBox");
    uielement.isDisabled = false;
    uielement.isChecked = car.Action.RaiseLower

    uielement = getFrameWindow().findWidget("carActionRaiseLowerSpinner");
    uielement.isDisabled = false;
    uielement.text = car.Action.Offset.toString();

    //Set recolour
    uielement = getFrameWindow().findWidget("carActionRecolourCheckBox");
    uielement.isDisabled = false;
    uielement.isChecked = car.Action.Recolour

    uielement = getFrameWindow().findWidget("carActionRecolourPicker1");
    uielement.isDisabled = false;
    uielement.colour = car.Action.BodyColour

    uielement = getFrameWindow().findWidget("carActionRecolourPicker2");
    uielement.isDisabled = false;
    uielement.colour = car.Action.TrimColour

    uielement = getFrameWindow().findWidget("carActionRecolourPicker3");
    uielement.isDisabled = false;
    uielement.colour = car.Action.TertiaryColour

    // Enable car type picker

    uielement = getFrameWindow().findWidget("carActionChangeVehicleCheckbox");
    uielement.isDisabled = false;
    uielement.isChecked = car.Action.ChangeVehicle

    uielement = getFrameWindow().findWidget("carActionChangeVehicleTextbox");
    uielement.isDisabled = false;
    uielement.text = car.Action.VehicleObject.toString()

    uielement = getFrameWindow().findWidget("carActionChangeVariantCheckbox");
    uielement.isDisabled = false;
    uielement.isChecked = car.Action.ChangeVariant

    uielement = getFrameWindow().findWidget("carActionChangeVariantTextbox");
    uielement.isDisabled = false;
    uielement.text = car.Action.VariantType.toString()

    // Enable apply to all
    uielement = getFrameWindow().findWidget("applyAllCars");
    uielement.isDisabled = false;

    // Enable saving again
    allowsave = true
}

function mainWindowGetSelectedAnimationId() {
    var list = getMainWindow().findWidget("animations");
    return list.items[list.selectedCell.row][0];
}

function mainWindowGetSelectedTriggerId() {
    var list = getMainWindow().findWidget("triggerlist");
    if (!list.selectedCell) {
        ui.showError("error:", "select a trigger first")
        return -1
    }
    return list.items[list.selectedCell.row][0];
}

function mainWindowGetSelectedFrameId() {
    var list = getMainWindow().findWidget("framelist");
    if (!list.selectedCell) {
        ui.showError("error:", "select a frame first")
        return -1
    }
    return list.items[list.selectedCell.row][0];
}

function frameWindowGetSelectedObjectId() {
    var list = getFrameWindow().findWidget("objectlist");
    if (!list.selectedCell) {
        ui.showError("error:", "select a object first")
        return -1
    }
    return list.items[list.selectedCell.row][0];
}

function frameWindowGetSelectedCarId() {
    var list = getFrameWindow().findWidget("carlist");
    if (!list.selectedCell) {
        ui.showError("error:", "select a car first")
        return -1
    }
    return list.items[list.selectedCell.row][0];
}

function tileWindowGetSelectedObjectIndex() {
    var list = getTileWindow().findWidget("objectlist");
    if (!list.selectedCell) {
        ui.showError("error:", "select a object first")
        return -1
    }
    return list.items[list.selectedCell.row][4];
}

function tileWindowGetSelectedObjectX() {
    var list = getTileWindow().findWidget("objectlist");
    if (!list.selectedCell) {
        ui.showError("error:", "select a object first")
        return -1
    }
    return list.items[list.selectedCell.row][1];
}

function tileWindowGetSelectedObjectY() {
    var list = getTileWindow().findWidget("objectlist");
    if (!list.selectedCell) {
        ui.showError("error:", "select a object first")
        return -1
    }
    return list.items[list.selectedCell.row][2];
}

function frameWindowSaveObject(animationid, frameid, objectid, save) {
    // Only save when allowed
    if (allowsave) {
        var updates = {
            Action: {
                RaiseLower: getFrameWindow().findWidget("objectActionRaiseLowerCheckBox").isChecked,
                Offset: +(getFrameWindow().findWidget("objectActionRaiseLowerSpinner").text.split(" ")[0]) * 2,
                Recolour: getFrameWindow().findWidget("objectActionRecolourCheckBox").isChecked,
                PrimaryColour: getFrameWindow().findWidget("objectActionRecolourPicker1").colour,
                SecondaryColour: getFrameWindow().findWidget("objectActionRecolourPicker2").colour,
                TertiaryColour: getFrameWindow().findWidget("objectActionRecolourPicker3").colour,
                HideShow: getFrameWindow().findWidget("objectActionHideCheckBox").isChecked,
                Hidden: getFrameWindow().findWidget("objectActionHideCheckBoxValue").isChecked,
                Rotate: getFrameWindow().findWidget("objectActionRotateCheckBox").isChecked,
                RotateBy: getFrameWindow().findWidget("objectActionRotateSpinner").text
            }
        }
        updateObject(animationid, frameid, objectid, updates, save)
    }
}

function frameWindowSaveCar(animationid, frameid, carid, save) {
    // Only save when allowed
    if (allowsave) {
        var updates = {
            Action: {
                RaiseLower: getFrameWindow().findWidget("carActionRaiseLowerCheckBox").isChecked,
                Offset: Number(getFrameWindow().findWidget("carActionRaiseLowerSpinner").text),
                Recolour: getFrameWindow().findWidget("carActionRecolourCheckBox").isChecked,
                BodyColour: getFrameWindow().findWidget("carActionRecolourPicker1").colour,
                TrimColour: getFrameWindow().findWidget("carActionRecolourPicker2").colour,
                TertiaryColour: getFrameWindow().findWidget("carActionRecolourPicker3").colour,
                ChangeVariant: getFrameWindow().findWidget("carActionChangeVariantCheckbox").isChecked,
                VariantType: Number(getFrameWindow().findWidget("carActionChangeVariantTextbox").text),
                ChangeVehicle: getFrameWindow().findWidget("carActionChangeVehicleCheckbox").isChecked,
                VehicleObject: Number(getFrameWindow().findWidget("carActionChangeVehicleTextbox").text)
            }
        }
        updateCar(animationid, frameid, carid, updates, save)
    }
}

function setAnimations(animations) {
    context.getParkStorage('Levis.Animations').set('animations', animations);

    // Update the button menu
    context.executeAction('RCTAnimation.checkButtons', { flags: 0 });
}

function getNewAnimationId() {
    animations = getAnimations().Animations
    if (animations.length < 1) {
        return 0
    }
    return (Math.max.apply(Math, animations.map(function (animation) { return animation.Id })) + 1)
}

function getNewTriggerId(animation) {
    if (animation.Triggers.length < 1) {
        return 0
    }
    return (Math.max.apply(Math, animation.Triggers.map(function (trigger) { return trigger.Id })) + 1)
}

function getNewFrameId(animation) {
    if (animation.Frames.length < 1) {
        return 0
    }
    return (Math.max.apply(Math, animation.Frames.map(function (frame) { return frame.Id })) + 1)
}

function getNewFrameObjectId(animation, frameid) {
    if (animation.Frames[frameid].Elements.length < 1) {
        return 0
    }
    return (Math.max.apply(Math, animation.Frames[frameid].Elements.map(function (element) { return element.Id })) + 1)
}

function getNewFrameCarId(animation, frameid) {
    if (animation.Frames[frameid].Cars.length < 1) {
        return 0
    }
    return (Math.max.apply(Math, animation.Frames[frameid].Cars.map(function (car) { return car.Id })) + 1)
}

function addAnimation(name) {
    var animations = getAnimations()
    animations.Animations.push(
        {
            Id: getNewAnimationId(),
            Name: name,
            Version: currentversion,
            CurrentFrame: -1,
            Active: false,
            Frames: [],
            Triggers: [
                {
                    Id: 0,
                    Name: "default",
                    Type: "continues"
                }
            ]
        }
    );

    // Store in park storage
    setAnimations(animations);
}

function addTrigger(id, name) {
    // Get the current trigger data
    var animation = getAnimationById(id);
    var triggers = animation.Triggers

    // Add a trigger
    triggers.push(
        {
            Id: getNewTriggerId(animation),
            Name: name,
            Type: "none"
        }
    )

    updateAnimation(id, { Triggers: triggers })
}

function addFrame(id, name) {
    // Get the current frame data
    var animation = getAnimationById(id);
    var frames = animation.Frames

    // Add a frame
    frames.push(
        {
            Id: getNewFrameId(animation),
            Name: name,
            Delay: 25,
            MoveCamera: false,
            MoveX: 0,
            MoveY: 0,
            MoveRotation: 0,
            MoveZoom: 0,
            Elements: [],
            Cars: []
        }
    )

    updateAnimation(id, { Frames: frames })
}

function genFrame(animationid, name) {
    // Get the animation data
    var animation = getAnimationById(animationid);
    // Check if there is at least one frame
    if (animation.Frames.length < 1) {
        ui.showError("error:", "you need at least one frame to generate a frame.")
        return
    }

    // Check if the current frame is one before the last frame
    var lastframeid = animation.Frames.length - 1
    if ((animation.CurrentFrame + 1) != lastframeid) {
        ui.showError("error:", "make sure the last frame is not yet applied.")
        return
    }

    // Get the last frame
    var lastframe = animation.Frames[lastframeid]

    // Gather all the X,Y and element id's for this frame
    var elementlist = []
    for (var i = 0; i < lastframe.Elements.length; i++) {
        elementlist.push({
            TileX: lastframe.Elements[i].TileX,
            TileY: lastframe.Elements[i].TileY,
            ElementId: getMapElementId(lastframe.Elements[i])
        })
    }

    // Gather all entityid's for the cars
    var carlist = []
    for (i = 0; i < lastframe.Cars.length; i++) {
        carlist.push({
            EntityId: getCarId(lastframe.Cars[i])
        })
    }

    // Progress the frame
    getMainWindow().findWidget("currentFrameSpinner").text = lastframeid.toString();

    // Do the animation
    context.executeAction('RCTAnimation.nextFrame', { animationId: animation.Id, flags: 0 }, function () {
        // Add a frame
        addFrame(animation.Id, name);

        // Add the objects to the frame
        for (i = 0; i < elementlist.length; i++) {
            addObject(animation.Id, (lastframeid + 1), elementlist[i].TileX, elementlist[i].TileY, elementlist[i].ElementId, false)
        }

        // Add the cars to the frame
        for (i = 0; i < carlist.length; i++) {
            addEntity(animation.Id, (lastframeid + 1), carlist[i].EntityId, false)
        }

        // Save the newly frame info
        saveFrame(animation.Id);

        // Update the framelist
        mainWindowSetFrameList(getAnimationById(mainWindowGetSelectedAnimationId()));
    });
}

function getObjectName(element) {
    var name = objectdata[element.type].prefix;
    var skipdiv = true // Skip the divider in the first loop

    for (var j = 0; j < objectdata[element.type].identifiers.length; j++) {
        if (!skipdiv) {
            name += " - "
        }
        else {
            skipdiv = false
        }
        switch (objectdata[element.type].objecttype[j]) {
            case "ride":
                if (element[objectdata[element.type].identifiers[j]]) {
                    try {
                        name += map.rides[element[objectdata[element.type].identifiers[j]]].name
                    } catch (e) { }
                }
                else {
                    skipdiv = true
                }
                break

            case "station":
                if (element.object == 0) {
                    name += "[Entrace]"
                }
                if (element.object == 1) {
                    name += "[Exit]"
                }
                if (element.ride) {
                    try {
                        name += context.getObject("station", map.rides[element.ride].stationStyle).name
                    } catch (e) { }
                }
                else {
                    skipdiv = true
                }
                break

            case "footpath":
                switch (objectdata[element.type].identifiers[j]) {
                    case "surfaceObject":
                        if (element.surfaceObject) {
                            try {
                                name += context.getObject("footpath_surface", element.surfaceObject).name
                            } catch (e) { }
                        }
                        else {
                            skipdiv = true
                        }
                        break

                    case "railingsObject":
                        if (element.railingsObject) {
                            try {
                                name += context.getObject("footpath_railings", element.railingsObject).name
                            } catch (e) { }
                        }
                        else {
                            skipdiv = true
                        }
                        break

                    case "object":
                        if (element.object) {
                            try {
                                name += context.getObject("footpath", element.object).name
                            } catch (e) { }
                        }
                        else {
                            skipdiv = true
                        }
                        break

                    case "isQueue":
                        if (element.isQueue) {
                            name += "Queue "
                        }
                        else {
                            skipdiv = true
                        }
                        break
                }
                break

            case "none":
                break

            default:
                if (element[objectdata[element.type].identifiers[j]]) {
                    try {
                        name += context.getObject(objectdata[element.type].objecttype[j], element[objectdata[element.type].identifiers[j]]).name
                    } catch (e) { }
                }
                else {
                    skipdiv = true
                }
                break
        }
    }

    return name
}

function addObject(animationid, frameid, x, y, elementindex, save) {
    // Get the current frame data
    var animation = getAnimationById(animationid)
    var frames = animation.Frames
    var frame = getFramebyId(animationid, frameid);

    // Check all elements added for this tile to see if any is the same as the one added. If so don't add it.
    var frameobjectnum = frame.Elements.length
    for (var i = 0; i < frameobjectnum; i++) {
        if ((frame.Elements[i].TileX == x) && (frame.Elements[i].TileY == y)) {
            if (getMapElementId(frame.Elements[i]) == elementindex) {
                return
            }
        }
    }

    // Get the Tile Element
    var element = map.getTile(x, y).getElement(elementindex);
    var name = getObjectName(element);

    // Create the base object
    var object = {
        Id: getNewFrameObjectId(animation, frameid),
        Name: name,
        TileX: x,
        TileY: y,
        ElementType: element.type,
        ElementIdentifier1: "",
        ElementIdentifier2: "",
        ElementIdentifier3: "",
        ElementIdentifier4: "",
        ElementIdentifier5: "",
        ElementQuadrants: element.occupiedQuadrants,
        ElementHeight: element.baseHeight,
        ElementDirection: element.direction,
        ElementHidden: element.isHidden,
        ElementPrimaryColour: element.primaryColour,
        ElementSecondaryColour: element.secondaryColour,
        ElementTertiaryColour: element.tertiaryColour,
        Action: {
            RaiseLower: false,
            Offset: 0,
            Recolour: false,
            PrimaryColour: element.primaryColour,
            SecondaryColour: element.secondaryColour,
            TertiaryColour: element.tertiaryColour,
            HideShow: false,
            Hidden: false,
            Rotate: false,
            RotateBy: 0
        }
    }

    // Get the identifiers
    for (var j = 0; j < objectdata[element.type].identifiers.length; j++) {
        object[identifieralias[objectdata[element.type].identifiers[j]]] = element[objectdata[element.type].identifiers[j]]
    }

    // Add a object
    frame.Elements.push(object)

    // If save is given save it (when batches are processed save will only be given on the last one)
    if (save) {
        updateAnimation(animationid, { Frames: frames })
    }
}

function addEntity(animationid, frameid, entityid, save) {
    // Get the current frame data
    var animation = getAnimationById(animationid)
    var frames = animation.Frames
    var frame = getFramebyId(animationid, frameid);

    // Get the Entity
    var entity = map.getEntity(entityid);

    // Check all cars added to see if any is the same as the one added. If so don't add it.
    var framecarnum = frame.Cars.length
    for (var i = 0; i < framecarnum; i++) {
        if (getCarId(frame.Cars[i]) == entityid) {
            return
        }
    }

    // Only allow cars to be selected
    if (entity.type !== "car") {
        return
    }

    // Get the train info and compile the name
    var traininfo = getCarTrainInfo(entity.id)
    var name = "Train " + (traininfo.train + 1) + " Car " + (traininfo.car + 1) + " - " + map.getRide(traininfo.ride).name

    // Add a object
    frame.Cars.push({
        Id: getNewFrameCarId(animation, frameid),
        Name: name,
        CarRide: entity.ride,
        CarTrain: traininfo.train,
        CarTrainCar: traininfo.car,
        CarVariantType: entity.VariantType,
        CarVehicle: entity.vehicleObject,
        Action: {
            RaiseLower: false,
            Offset: 0,
            Recolour: false,
            BodyColour: entity.colours.body,
            TrimColour: entity.colours.trim,
            TertiaryColour: entity.colours.tertiary,
            ChangeVariant: false,
            VariantType: 0,
            ChangeVehicle: false,
            VehicleObject: 0,
            TravelBy: false,
            TravelDistance: 0
        }
    })

    // If save is given save it (when batches are processed save will only be given on the last one)
    if (save) {
        updateAnimation(animationid, { Frames: frames })
    }
}

function saveFrame(animationid) {
    // Get the current frame data
    var animation = getAnimationById(animationid)
    var frames = animation.Frames

    updateAnimation(animationid, { Frames: frames })
}

function removeAnimation(animationid) {
    // Get the current trigger data
    var animations = getAnimations().Animations.filter(function (animation) {
        return animation.Id != animationid
    })

    setAnimations({ Animations: animations });
}

function removeTrigger(animationid, triggerid) {
    // Get the current trigger data
    var animation = getAnimationById(animationid);
    var triggers = animation.Triggers.filter(function (trigger) {
        return trigger.Id != triggerid
    })

    updateAnimation(animationid, { Triggers: triggers })
}

function removeFrame(animationid, frameid) {
    // Get the current frame data
    var animation = getAnimationById(animationid);
    var frames = animation.Frames.filter(function (frame) {
        return frame.Id != frameid
    })

    updateAnimation(animationid, { Frames: frames })
}

function removeObject(animationid, frameid, objectid) {
    // Get the current frame data
    var animation = getAnimationById(animationid);
    var frames = animation.Frames
    // remove the object
    frames[frameid].Elements = frames[frameid].Elements.filter(function (element) {
        return element.Id != objectid
    })

    updateAnimation(animationid, { Frames: frames })
}

function removeCar(animationid, frameid, carid) {
    // Get the current frame data
    var animation = getAnimationById(animationid);
    var frames = animation.Frames
    // remove the object
    frames[frameid].Cars = frames[frameid].Cars.filter(function (car) {
        return car.Id != carid
    })

    updateAnimation(animationid, { Frames: frames })
}

function updateTrigger(animationid, triggerid, updates) {
    var animation = getAnimationById(animationid);
    var trigger = getTriggerbyId(animationid, triggerid);

    // Update the values in the trigger
    // Loop through all keys and set the new values
    Object.keys(updates).forEach(
        function (key) {
            trigger[key] = updates[key]
        }
    )

    updateAnimation(animationid, { Triggers: animation.Triggers })
}

function updateFrame(animationid, frameid, updates) {
    var animation = getAnimationById(animationid);
    var frame = getFramebyId(animationid, frameid);

    // Update the values in the frame
    // Loop through all keys and set the new values
    Object.keys(updates).forEach(
        function (key) {
            frame[key] = updates[key]
        }
    )

    updateAnimation(animationid, { Frames: animation.Frames })
}

function updateObject(animationid, frameid, objectid, updates, save) {
    var elements = getFramebyId(animationid, frameid).Elements
    var object = null

    // Find the right object
    for (var i = 0; i < elements.length; i++) {
        if (elements[i].Id == objectid) {
            object = elements[i]
        }
    }

    // Update the values in the object
    // Loop through all keys and set the new values
    Object.keys(updates).forEach(
        function (key) {
            object[key] = updates[key]
        }
    )

    // If save is given save it (when batches are processed save will only be given on the last one)
    if (save) {
        updateFrame(animationid, frameid, { Elements: elements })
    }
}

function updateCar(animationid, frameid, carid, updates, save) {
    var cars = getFramebyId(animationid, frameid).Cars
    var car = null

    // Find the right car
    for (var i = 0; i < cars.length; i++) {
        if (cars[i].Id == carid) {
            car = cars[i]
        }
    }

    // Update the values in the car
    // Loop through all keys and set the new values
    Object.keys(updates).forEach(
        function (key) {
            car[key] = updates[key]
        }
    )

    // If save is given save it (when batches are processed save will only be given on the last one)
    if (save) {
        updateFrame(animationid, frameid, { Cars: cars })
    }
}

function updateAnimation(id, updates) {
    // updates is defined as a object containing the keys and values that need to be updates

    var animations = getAnimations();
    var animation = getAnimationById(id);

    // Loop through all keys and set the new values
    Object.keys(updates).forEach(
        function (key) {
            animation[key] = updates[key]
        }
    )

    // Store in park storage
    setAnimations(animations);
}

// Shared UI
function errorWindow(message, source) {
    // Close the source window
    ui.getWindow(source).close()

    // Num of tiles
    widgets.push({
        type: 'label',
        name: 'error',
        x: 5,
        y: 20,
        width: 140,
        height: 20,
        text: message
    });

    // Display the error
    window = ui.openWindow({
        classification: 'RctAnimationErrorMessage',
        title: "Error",
        width: 150,
        height: 50,
        x: 300,
        y: 300,
        colours: [26, 26],
        widgets: widgets
    });
}

// Manager UI
function mainWindow() {
    var widgets = []

    // Lay-out
    widgets.push({
        type: 'button',
        name: "NewAnimation",
        x: 10,
        y: 20,
        width: 110,
        height: 20,
        text: "Add New Animation",
        onClick: function onClick() {
            ui.showTextInput({
                title: "New Animation",
                description: "What is the name for the new animation?",
                callback: function (name) {
                    addAnimation(name);
                    mainWindowSetAnimationList();
                }
            })
        }
    });

    // Message Selection
    widgets.push({
        type: 'listview',
        name: 'animations',
        x: 5,
        y: 50,
        width: 240,
        height: 310,
        scrollbars: "vertical",
        isStriped: true,
        showColumnHeaders: true,
        columns: [
            {
                canSort: true,
                header: "ID",
                ratioWidth: 1,
                sortOrder: "ascending"
            },
            {
                canSort: true,
                header: "Animation",
                ratioWidth: 6,
                sortOrder: "ascending"
            },
            {
                canSort: false,
                header: "Active",
                ratioWidth: 2
            },
            {
                canSort: false,
                header: "Fr",
                ratioWidth: 1
            }
        ],
        items: [],
        selectedCell: 0,
        canSelect: true,
        onClick: function onClick(item, column) {
            mainWindowSetAnimationInfo(getAnimations().Animations[item]);
        }
    });

    // Frame Selection
    widgets.push({
        type: 'groupbox',
        name: 'animationBox',
        x: 250,
        y: 50,
        width: 340,
        height: 310,
        text: "Animation Information"
    });

    widgets.push({
        type: 'label',
        name: 'AnimationNameLabel',
        x: 260,
        y: 65,
        width: 50,
        height: 15,
        text: "Name:"
    });

    widgets.push({
        type: "textbox",
        name: "AnimationNameTextBox",
        isDisabled: true,
        x: 310,
        y: 65,
        width: 175,
        height: 15,
        text: "",
        isDisabled: true
    });

    widgets.push({
        type: 'label',
        name: 'AnimationActionLabel',
        x: 260,
        y: 85,
        width: 50,
        height: 15,
        text: "Active:"
    });

    widgets.push({
        type: 'checkbox',
        name: "AnimationActionCheckBox",
        isDisabled: true,
        x: 310,
        y: 82,
        width: 15,
        height: 15,
        isChecked: false,
        text: "",
        onChange: function onChange(e) {
        }
    });

    widgets.push({
        type: 'button',
        name: "SaveAnimationInfo",
        isDisabled: true,
        x: 260,
        y: 100,
        width: 170,
        height: 20,
        text: "Update Animation info",
        onClick: function onClick() {
            // Validation
            if (getMainWindow().findWidget("framelist").items.length <= 1) {
                ui.showError("error:", "animation requires at least 2 frames to be able to activated.")
                return
            }
            // Save the settings
            updateAnimation(mainWindowGetSelectedAnimationId(), {
                Name: getMainWindow().findWidget("AnimationNameTextBox").text,
                Active: getMainWindow().findWidget("AnimationActionCheckBox").isChecked
            });
            // Refresh the windows
            mainWindowSetAnimationList();
            mainWindowSetAnimationInfo(getAnimationById(mainWindowGetSelectedAnimationId()));
        }
    });

    widgets.push({
        type: 'button',
        name: "DeleteAnimation",
        isDisabled: true,
        x: 440,
        y: 100,
        width: 145,
        height: 20,
        text: "Delete Animation",
        onClick: function onClick() {
            removeAnimation(mainWindowGetSelectedAnimationId());
        }
    });

    widgets.push({
        type: 'label',
        name: 'TriggerLabel',
        x: 260,
        y: 125,
        width: 150,
        height: 15,
        text: "Animation Triggers:"
    });

    widgets.push({
        type: 'listview',
        name: 'triggerlist',
        isDisabled: true,
        x: 260,
        y: 145,
        width: 250,
        height: 80,
        scrollbars: "vertical",
        isStriped: true,
        showColumnHeaders: true,
        columns: [
            {
                canSort: true,
                header: "ID",
                ratioWidth: 1,
                sortOrder: "ascending"
            },
            {
                canSort: true,
                header: "Trigger",
                ratioWidth: 6,
                sortOrder: "ascending"
            },
            {
                canSort: false,
                header: "Type",
                ratioWidth: 3
            }
        ],
        items: [],
        selectedCell: 0,
        canSelect: true
    });

    widgets.push({
        type: 'button',
        name: "AddTriggerButton",
        isDisabled: true,
        x: 515,
        y: 150,
        width: 65,
        height: 20,
        text: "Add Trigger",
        onClick: function onClick() {
            ui.showTextInput({
                title: "New Animation Trigger",
                description: "What is the name for the new Trigger?",
                callback: function (name) {
                    var id = mainWindowGetSelectedAnimationId();
                    addTrigger(id, name);
                    mainWindowSetTriggerList(getAnimationById(id));
                }
            })
        }
    });

    widgets.push({
        type: 'button',
        name: "EditTriggerButton",
        isDisabled: true,
        x: 515,
        y: 175,
        width: 65,
        height: 20,
        text: "Edit Trigger",
        onClick: function onClick() {
            if (mainWindowGetSelectedTriggerId() >= 0) {
                triggerEditWindow(mainWindowGetSelectedAnimationId(), getTriggerbyId(mainWindowGetSelectedAnimationId(), mainWindowGetSelectedTriggerId()))
            }
        }
    });

    widgets.push({
        type: 'button',
        name: "DeleteTriggerButton",
        isDisabled: true,
        x: 515,
        y: 200,
        width: 65,
        height: 20,
        text: "Del Trigger",
        onClick: function onClick() {
            var id = mainWindowGetSelectedAnimationId();
            var triggerid = mainWindowGetSelectedTriggerId();
            removeTrigger(id, triggerid);
            mainWindowSetTriggerList(getAnimationById(id));
        }
    });

    widgets.push({
        type: 'label',
        name: 'FrameLabel',
        x: 260,
        y: 235,
        width: 150,
        height: 15,
        text: "Animation Frames:"
    });

    widgets.push({
        type: 'listview',
        name: 'framelist',
        isDisabled: true,
        x: 260,
        y: 255,
        width: 250,
        height: 80,
        scrollbars: "vertical",
        isStriped: true,
        showColumnHeaders: true,
        columns: [
            {
                canSort: true,
                header: "ID",
                ratioWidth: 1,
                sortOrder: "ascending"
            },
            {
                canSort: true,
                header: "Frame",
                ratioWidth: 7,
                sortOrder: "ascending"
            },
            {
                canSort: false,
                header: "Delay",
                ratioWidth: 2
            }
        ],
        items: [],
        selectedCell: 0,
        canSelect: true
    });

    widgets.push({
        type: 'button',
        name: "AddFrameButton",
        isDisabled: true,
        x: 515,
        y: 260,
        width: 65,
        height: 20,
        text: "Add Frame",
        onClick: function onClick() {
            ui.showTextInput({
                title: "New Animation Frame",
                description: "What is the name for the new Frame?",
                callback: function (name) {
                    var id = mainWindowGetSelectedAnimationId();
                    addFrame(id, name);
                    mainWindowSetFrameList(getAnimationById(id));
                }
            })
        }
    });

    widgets.push({
        type: 'button',
        name: "GenFrameButton",
        isDisabled: true,
        x: 515,
        y: 285,
        width: 65,
        height: 20,
        text: "Gen Frame",
        onClick: function onClick() {
            ui.showTextInput({
                title: "Generate Animation Frame",
                description: "What is the name for the new Frame?",
                callback: function (name) {
                    // Start the progress windows
                    progressWindow("Generating Frame")

                    // Call the function with a slight delay so the window is drawn.
                    var timeout = context.setTimeout(function () {
                        genFrame(mainWindowGetSelectedAnimationId(), name);
                        // clear the timeout
                        context.clearTimeout(timeout);
                        // Close the window
                        getProgressWindow().close();
                    }, 1)
                }
            })
        }
    });

    widgets.push({
        type: 'button',
        name: "EditFrameButton",
        isDisabled: true,
        x: 515,
        y: 310,
        width: 65,
        height: 20,
        text: "Edit Frame",
        onClick: function onClick() {
            if (mainWindowGetSelectedFrameId() >= 0) {
                hideMainWindow();
                frameEditWindow(mainWindowGetSelectedAnimationId(), getFramebyId(mainWindowGetSelectedAnimationId(), mainWindowGetSelectedFrameId()));
            }
        }
    });

    widgets.push({
        type: 'button',
        name: "DeleteFrameButton",
        isDisabled: true,
        x: 515,
        y: 335,
        width: 65,
        height: 20,
        text: "Del Frame",
        onClick: function onClick() {
            var id = mainWindowGetSelectedAnimationId();
            var frameid = mainWindowGetSelectedFrameId();
            removeFrame(id, frameid);
            mainWindowSetFrameList(getAnimationById(id));
        }
    });

    widgets.push({
        type: 'label',
        name: 'currentFrameLabel',
        x: 260,
        y: 340,
        width: 150,
        height: 15,
        text: "Currently applied frame: "
    });

    widgets.push({
        type: "spinner",
        name: "currentFrameSpinner",
        isDisabled: true,
        x: 410,
        y: 340,
        width: 100,
        height: 15,
        text: "0",
        onDecrement: function onDecrement(e) { },
        onIncrement: function onIncrement(e) {
            var animationId = mainWindowGetSelectedAnimationId();
            var animation = getAnimationById(animationId);
            var fnum = Number(getMainWindow().findWidget("currentFrameSpinner").text);
            fnum = fnum + 1;
            if (fnum >= animation.Frames.length) {
                fnum = 0
            }
            getMainWindow().findWidget("currentFrameSpinner").text = fnum.toString();

            // Do the animation
            context.executeAction('RCTAnimation.nextFrame', { animationId: animationId, flags: 0 });
        }
    });

    // Create the window
    window = ui.openWindow({
        classification: 'RctAnimationManager',
        title: "RCT Animation Manager 0.6 (by Levis)",
        width: 600,
        height: 370,
        x: 100,
        y: 100,
        colours: [12, 12],
        widgets: widgets,
        onClose: function () {
            if (getTriggerWindow()) {
                getTriggerWindow().close()
            }
            if (getFrameWindow()) {
                getFrameWindow().close()
            }
        }
    });

    // Update the animation list every time a animation proceed a frame
    context.subscribe("action.execute", function (e) {
        if (e.action == "RCTAnimation.nextFrame") {
            if (getMainWindow()) {
                mainWindowSetAnimationList();
            }
        }
    });

    // OnLoad
    mainWindowSetAnimationList()
}

function triggerEditWindow(animationid, trigger) {
    //vars
    var buttonpos = ""
    var framesToPlay = ""
    var delaystart = 1
    var buttonExclusive = false
    var buttonKeepPressed = false
    if (trigger.ButtonPos) { buttonpos = trigger.ButtonPos.toString() }
    if (trigger.FramesToPlay) { framesToPlay = trigger.FramesToPlay.toString() }
    if (trigger.ContinuesStartDelay) { delaystart = trigger.ContinuesStartDelay }
    if (trigger.ButtonExclusive) { buttonExclusive = trigger.ButtonExclusive }
    if (trigger.ButtonKeepPressed) { buttonKeepPressed = trigger.ButtonKeepPressed }

    var widgets = []

    // Tab time
    widgets.push({
        type: 'groupbox',
        name: 'triggerbox',
        x: 5,
        y: 20,
        width: 160,
        height: 120,
        text: "General Info"
    });

    widgets.push({
        type: 'label',
        name: 'TriggerNameLabel',
        x: 10,
        y: 35,
        width: 40,
        height: 15,
        text: "Name:"
    });

    widgets.push({
        type: "textbox",
        name: "TriggerNameTextBox",
        x: 60,
        y: 35,
        width: 100,
        height: 15,
        text: trigger.Name
    });

    widgets.push({
        type: 'label',
        name: 'triggerdescription',
        x: 10,
        y: 55,
        width: 180,
        height: 15,
        text: "Select the type of trigger"
    });

    widgets.push({
        type: "dropdown",
        name: "triggerTypeDropDown",
        x: 10,
        y: 70,
        width: 150,
        height: 15,
        items: supportedtriggers,
        selectedIndex: supportedtriggers.indexOf(trigger.Type),
        onChange: function () {
            triggerwindowSetTriggerSettings();
        }
    });

    widgets.push({
        type: 'groupbox',
        name: 'triggerbox',
        x: 170,
        y: 20,
        width: 225,
        height: 145,
        text: "Trigger Settings"
    });

    // Trigger Continues

    widgets.push({
        type: 'label',
        name: 'TriggerContinuesStartLabel',
        x: 175,
        y: 35,
        width: 80,
        height: 15,
        text: "Delay Start:",
        tooltip: "initial delay before the animation starts in ticks, can be used to make sure things dont all run on the same frames"
    });

    widgets.push({
        type: "textbox",
        name: "TriggerContinuesStartTextBox",
        x: 260,
        y: 35,
        width: 130,
        height: 15,
        text: delaystart.toString(),
        tooltip: "initial delay before the animation starts in ticks, can be used to make sure things dont all run on the same frames"
    });

    // Trigger Button

    widgets.push({
        type: 'label',
        name: 'TriggerButtonNameLabel',
        x: 175,
        y: 35,
        width: 80,
        height: 15,
        text: "Button Text:",
        tooltip: "Text which will be shown on the button"
    });

    widgets.push({
        type: "textbox",
        name: "TriggerButtonNameTextBox",
        x: 260,
        y: 35,
        width: 130,
        height: 15,
        text: trigger.ButtonName,
        tooltip: "Text which will be shown on the button"
    });

    widgets.push({
        type: 'label',
        name: 'TriggerButtonPosLabel',
        x: 175,
        y: 60,
        width: 80,
        height: 15,
        text: "Position (1,2..):",
        tooltip: "Position in the menu, starts at 1. You can skip numbers to create open spaces"
    });

    widgets.push({
        type: "textbox",
        name: "TriggerButtonPosTextBox",
        x: 260,
        y: 60,
        width: 130,
        height: 15,
        text: buttonpos,
        tooltip: "Position in the menu, starts at 1. You can skip numbers to create open spaces"
    });

    widgets.push({
        type: 'label',
        name: 'TriggerButtonExclusiveLabel',
        x: 175,
        y: 80,
        width: 80,
        height: 15,
        text: "Exclusive:",
        tooltip: "If this is selected once the button is pressed no other button can be pressed untill it's pressed again"
    });

    widgets.push({
        type: 'checkbox',
        name: 'TriggerButtonExclusiveCheckbox',
        x: 260,
        y: 80,
        width: 15,
        height: 15,
        text: "",
        isChecked: buttonExclusive,
        tooltip: "If this is selected once the button is pressed no other button can be pressed untill it's pressed again"
    });

    widgets.push({
        type: 'label',
        name: 'TriggerButtonKeepPressedLabel',
        x: 175,
        y: 100,
        width: 80,
        height: 15,
        text: "Keep pressed:",
        tooltip: "If this is selected the button will stay pressed untill clicked again"
    });

    widgets.push({
        type: 'checkbox',
        name: 'TriggerButtonKeepPressedCheckbox',
        x: 260,
        y: 100,
        width: 15,
        height: 15,
        text: "",
        isChecked: buttonKeepPressed,
        tooltip: "If this is selected the button will stay pressed untill clicked again"
    });

    widgets.push({
        type: 'label',
        name: 'TriggerButtonFramesLabel',
        x: 175,
        y: 120,
        width: 80,
        height: 15,
        text: "Num frames:",
        tooltip: "Amount of frames to progress on button press"
    });

    widgets.push({
        type: "textbox",
        name: "TriggerButtonFramesTextBox",
        x: 260,
        y: 120,
        width: 130,
        height: 15,
        text: framesToPlay,
        tooltip: "Amount of frames to progress on button press"
    });

    // Trigger carOnTrack

    widgets.push({
        type: 'label',
        name: 'TriggerCarOnTrackXYLabel',
        x: 175,
        y: 35,
        width: 80,
        height: 15,
        text: "Track (X,Y):",
        tooltip: ""
    });

    widgets.push({
        type: 'label',
        name: 'TriggerCarOnTrackZDLabel',
        x: 175,
        y: 55,
        width: 80,
        height: 15,
        text: "                  (Z,D):",
        tooltip: ""
    });

    widgets.push({
        type: "textbox",
        name: "TriggerCarOnTrackXTextBox",
        x: 260,
        y: 35,
        width: 50,
        height: 15,
        text: (trigger.CarOnTrackX || "").toString(),
        tooltip: ""
    });

    widgets.push({
        type: "textbox",
        name: "TriggerCarOnTrackYTextBox",
        x: 310,
        y: 35,
        width: 50,
        height: 15,
        text: (trigger.CarOnTrackY || "").toString(),
        tooltip: ""
    });

    widgets.push({
        type: "textbox",
        name: "TriggerCarOnTrackZTextBox",
        x: 260,
        y: 55,
        width: 50,
        height: 15,
        text: (trigger.CarOnTrackZ || "").toString(),
        tooltip: ""
    });

    widgets.push({
        type: "textbox",
        name: "TriggerCarOnTrackDTextBox",
        x: 310,
        y: 55,
        width: 50,
        height: 15,
        text: (trigger.CarOnTrackD || "").toString(),
        tooltip: ""
    });

    widgets.push({
        type: 'button',
        name: "TriggerCarOnTrackEyeDropper",
        x: 365,
        y: 35,
        width: 22,
        height: 35,
        image: "eyedropper",
        border: true,
        onClick: function onClick() {
            var pressed = false
            if (getTriggerWindow().findWidget("TriggerCarOnTrackEyeDropper")) {
                pressed = getTriggerWindow().findWidget("TriggerCarOnTrackEyeDropper").isPressed
            }
            if (pressed) {
                getTriggerWindow().findWidget("TriggerCarOnTrackEyeDropper").isPressed = false;
                if (ui.tool) {
                    ui.tool.cancel()
                }
            }
            else {
                getTriggerWindow().findWidget("TriggerCarOnTrackEyeDropper").isPressed = true;
                ui.activateTool({
                    id: "RCTAnimatorTriggerTrackSelector",
                    cursor: "cross_hair",
                    filter: ["ride"],
                    onDown: function (e) {
                        if (e.tileElementIndex != null) {
                            var track = map.getTrackIterator({ x: (e.mapCoords.x), y: (e.mapCoords.y) }, e.tileElementIndex)
                            if (track) {
                                getTriggerWindow().findWidget("TriggerCarOnTrackXTextBox").text = track.position.x.toString()
                                getTriggerWindow().findWidget("TriggerCarOnTrackYTextBox").text = track.position.y.toString()
                                getTriggerWindow().findWidget("TriggerCarOnTrackZTextBox").text = track.position.z.toString()
                                getTriggerWindow().findWidget("TriggerCarOnTrackDTextBox").text = track.position.direction.toString()

                                // Cancel tool too
                                getTriggerWindow().findWidget("TriggerCarOnTrackEyeDropper").isPressed = false;
                                if (ui.tool) {
                                    ui.tool.cancel()
                                }
                            }
                        }
                    }
                })
            }
        }
    });

    widgets.push({
        type: 'label',
        name: 'TriggerCarOnTrackRideLabel',
        x: 175,
        y: 75,
        width: 80,
        height: 15,
        text: "Ride (id):",
        tooltip: ""
    });

    widgets.push({
        type: "textbox",
        name: "TriggerCarOnTrackRideTextBox",
        x: 260,
        y: 75,
        width: 100,
        height: 15,
        text: (trigger.CarOnTrackRide || "").toString(),
        tooltip: ""
    });

    widgets.push({
        type: 'label',
        name: 'TriggerCarOnTrackTrainLabel',
        x: 175,
        y: 95,
        width: 80,
        height: 15,
        text: "Train (-1 = all):",
        tooltip: ""
    });

    widgets.push({
        type: "textbox",
        name: "TriggerCarOnTrackTrainTextBox",
        x: 260,
        y: 95,
        width: 100,
        height: 15,
        text: (trigger.CarOnTrackTrain || "").toString(),
        tooltip: ""
    });

    widgets.push({
        type: 'label',
        name: 'TriggerCarOnTrackCarLabel',
        x: 175,
        y: 115,
        width: 80,
        height: 15,
        text: "Car (-1 = all):",
        tooltip: ""
    });

    widgets.push({
        type: "textbox",
        name: "TriggerCarOnTrackCarTextBox",
        x: 260,
        y: 115,
        width: 100,
        height: 15,
        text: (trigger.CarOnTrackCar || "").toString(),
        tooltip: ""
    });

    widgets.push({
        type: 'button',
        name: "TriggerCarOnTrackEyeDropperCar",
        x: 365,
        y: 75,
        width: 22,
        height: 55,
        image: "eyedropper",
        border: true,
        onClick: function onClick() {
            var pressed = false
            if (getTriggerWindow().findWidget("TriggerCarOnTrackEyeDropperCar")) {
                pressed = getTriggerWindow().findWidget("TriggerCarOnTrackEyeDropperCar").isPressed
            }
            if (pressed) {
                getTriggerWindow().findWidget("TriggerCarOnTrackEyeDropperCar").isPressed = false;
                if (ui.tool) {
                    ui.tool.cancel()
                }
            }
            else {
                getTriggerWindow().findWidget("TriggerCarOnTrackEyeDropperCar").isPressed = true;
                ui.activateTool({
                    id: "RCTAnimatorTriggerTrackSelector",
                    cursor: "cross_hair",
                    filter: ["entity"],
                    onDown: function (e) {
                        if (e.entityId != null) {
                            var entity = map.getEntity(e.entityId)
                            if (entity) {
                                if (entity.type == "car") {
                                    var traininfo = getCarTrainInfo(entity.id)
                                    getTriggerWindow().findWidget("TriggerCarOnTrackTrainTextBox").text = traininfo.train.toString()
                                    getTriggerWindow().findWidget("TriggerCarOnTrackCarTextBox").text = traininfo.car.toString()
                                    getTriggerWindow().findWidget("TriggerCarOnTrackRideTextBox").text = traininfo.ride.toString()

                                    // Cancel tool too
                                    getTriggerWindow().findWidget("TriggerCarOnTrackEyeDropperCar").isPressed = false;
                                    if (ui.tool) {
                                        ui.tool.cancel()
                                    }
                                }
                            }
                        }
                    }
                })
            }
        }
    });

    widgets.push({
        type: 'label',
        name: 'TriggerCarOnTrackFramesLabel',
        x: 175,
        y: 135,
        width: 80,
        height: 15,
        text: "Num frames:",
        tooltip: "Amount of frames to progress on button press"
    });

    widgets.push({
        type: "textbox",
        name: "TriggerCarOnTrackFramesTextBox",
        x: 260,
        y: 135,
        width: 130,
        height: 15,
        text: framesToPlay,
        tooltip: "Amount of frames to progress on button press"
    });

    // Save Trigger

    widgets.push({
        type: 'button',
        name: "SaveTrigger",
        x: 5,
        y: 145,
        width: 100,
        height: 20,
        text: "Update Trigger",
        onClick: function onClick() {
            var triggerType = supportedtriggers[getTriggerWindow().findWidget("triggerTypeDropDown").selectedIndex]
            var triggerInfo = {
                Name: getTriggerWindow().findWidget("TriggerNameTextBox").text,
                Type: triggerType,
            }
            if (triggerType == "continues") {
                triggerInfo.ContinuesStartDelay = Number(getTriggerWindow().findWidget("TriggerContinuesStartTextBox").text)
            }
            if (triggerType == "button") {
                triggerInfo.ButtonName = getTriggerWindow().findWidget("TriggerButtonNameTextBox").text;
                triggerInfo.ButtonPos = Number(getTriggerWindow().findWidget("TriggerButtonPosTextBox").text);
                triggerInfo.ButtonExclusive = getTriggerWindow().findWidget("TriggerButtonExclusiveCheckbox").isChecked;
                triggerInfo.ButtonKeepPressed = getTriggerWindow().findWidget("TriggerButtonKeepPressedCheckbox").isChecked;
                triggerInfo.FramesToPlay = Number(getTriggerWindow().findWidget("TriggerButtonFramesTextBox").text);
            }
            if (triggerType = "carOnTrack") {
                triggerInfo.CarOnTrackX = Number(getTriggerWindow().findWidget("TriggerCarOnTrackXTextBox").text);
                triggerInfo.CarOnTrackY = Number(getTriggerWindow().findWidget("TriggerCarOnTrackYTextBox").text);
                triggerInfo.CarOnTrackZ = Number(getTriggerWindow().findWidget("TriggerCarOnTrackZTextBox").text);
                triggerInfo.CarOnTrackD = Number(getTriggerWindow().findWidget("TriggerCarOnTrackDTextBox").text);
                triggerInfo.CarOnTrackRide = Number(getTriggerWindow().findWidget("TriggerCarOnTrackRideTextBox").text);
                triggerInfo.CarOnTrackTrain = Number(getTriggerWindow().findWidget("TriggerCarOnTrackTrainTextBox").text);
                triggerInfo.CarOnTrackCar = Number(getTriggerWindow().findWidget("TriggerCarOnTrackCarTextBox").text);
                triggerInfo.FramesToPlay = Number(getTriggerWindow().findWidget("TriggerCarOnTrackFramesTextBox").text);
            }
            updateTrigger(animationid, trigger.Id, triggerInfo)
            mainWindowSetTriggerList(getAnimationById(mainWindowGetSelectedAnimationId()));
            window.close()
        }
    });

    // Create the window
    window = ui.openWindow({
        classification: 'RctAnimationManagerTriggerEdit',
        title: "Edit Trigger",
        width: 400,
        height: 170,
        x: 300,
        y: 150,
        colours: [13, 13],
        widgets: widgets,
        onClose: function () {
            if (ui.tool) {
                ui.tool.cancel()
            }
        }
    });

    // Check the button checkbox
    triggerwindowSetTriggerSettings();
}

function frameEditWindow(animationid, frame) {
    // Vars
    var ghostobjects = [{ x: -1, y: -1, element: -1 }]
    var addObjectTool = false
    var addCarTool = false

    // UI
    var tabs = []
    var widgets = []

    // Tab time
    widgets.push({
        type: 'groupbox',
        name: 'timingBox',
        x: 5,
        y: 50,
        width: 190,
        height: 35,
        text: "Timing Information"
    });

    widgets.push({
        type: 'label',
        name: 'frameDelayLabel',
        x: 10,
        y: 65,
        width: 50,
        height: 15,
        text: "Delay:"
    });

    widgets.push({
        type: "textbox",
        name: "frameDelayTextbox",
        tooltip: "delay is in ticks, so 25 ticks is about a second depending on the game speed.",
        x: 55,
        y: 65,
        width: 40,
        height: 15,
        text: frame.Delay.toString(),
        onChange: function () {
            frame.Delay = getFrameWindow().findWidget("frameDelayTextbox").text;
            // Update the main window
            mainWindowSetFrameList(getAnimationById(mainWindowGetSelectedAnimationId()));
            // Save the Frame
            frameWindowSaveObject(animationid, frame.Id, frameWindowGetSelectedObjectId(), true);
        }
    });

    widgets.push({
        type: 'groupbox',
        name: 'cameraBox',
        x: 5,
        y: 90,
        width: 190,
        height: 120,
        text: "Camera Information"
    });

    widgets.push({
        type: 'checkbox',
        name: 'cameraMoveEnableCheckbox',
        x: 10,
        y: 105,
        width: 100,
        height: 15,
        isChecked: frame.MoveCamera,
        text: "Move Camera",
        onChange: function () {
            frame.MoveCamera = getFrameWindow().findWidget("cameraMoveEnableCheckbox").isChecked;
            // Save the Frame
            saveFrame(animationid);
        }
    });

    widgets.push({
        type: 'label',
        name: 'cameraMoveXLabel',
        x: 10,
        y: 125,
        width: 60,
        height: 15,
        text: "Position X:"
    });

    widgets.push({
        type: "textbox",
        name: "cameraMoveXTextbox",
        x: 75,
        y: 125,
        width: 50,
        height: 15,
        text: (frame.MoveX || "0").toString(),
        onChange: function () {
            frame.MoveX = Number(getFrameWindow().findWidget("cameraMoveXTextbox").text);
            // Save the Frame
            saveFrame(animationid);
        }
    });

    widgets.push({
        type: 'label',
        name: 'cameraMoveYLabel',
        x: 10,
        y: 145,
        width: 60,
        height: 15,
        text: "Position Y:"
    });

    widgets.push({
        type: "textbox",
        name: "cameraMoveYTextbox",
        x: 75,
        y: 145,
        width: 50,
        height: 15,
        text: (frame.MoveY || "0").toString(),
        onChange: function () {
            frame.MoveY = Number(getFrameWindow().findWidget("cameraMoveYTextbox").text);
            // Save the Frame
            saveFrame(animationid);
        }
    });

    widgets.push({
        type: 'label',
        name: 'cameraRotationLabel',
        x: 10,
        y: 165,
        width: 60,
        height: 15,
        text: "Rotation:"
    });

    widgets.push({
        type: "textbox",
        name: "cameraRotationTextbox",
        x: 75,
        y: 165,
        width: 50,
        height: 15,
        text: (frame.MoveRotation || "0").toString(),
        onChange: function () {
            frame.MoveRotation = Number(getFrameWindow().findWidget("cameraRotationTextbox").text);
            // Save the Frame
            saveFrame(animationid);
        }
    });

    widgets.push({
        type: 'label',
        name: 'cameraZoomLabel',
        x: 10,
        y: 185,
        width: 60,
        height: 15,
        text: "Zoom:"
    });

    widgets.push({
        type: "textbox",
        name: "cameraZoomTextbox",
        x: 75,
        y: 185,
        width: 50,
        height: 15,
        text: (frame.MoveZoom || "0").toString(),
        onChange: function () {
            frame.MoveZoom = Number(getFrameWindow().findWidget("cameraZoomTextbox").text);
            // Save the Frame
            saveFrame(animationid);
        }
    });

    widgets.push({
        type: 'button',
        name: "SelectObject",
        x: 127,
        y: 125,
        width: 55,
        height: 76,
        text: "Set{NEWLINE}Current{NEWLINE}View",
        onClick: function onClick() {
            var curpos = ui.mainViewport.getCentrePosition()
            getFrameWindow().findWidget("cameraMoveXTextbox").text = curpos.x.toString()
            getFrameWindow().findWidget("cameraMoveYTextbox").text = curpos.y.toString()
            getFrameWindow().findWidget("cameraRotationTextbox").text = ui.mainViewport.rotation.toString()
            getFrameWindow().findWidget("cameraZoomTextbox").text = ui.mainViewport.zoom.toString()

            frame.MoveX = curpos.x
            frame.MoveY = curpos.y
            frame.MoveRotation = ui.mainViewport.rotation
            frame.MoveZoom = ui.mainViewport.zoom

            // Save the Frame
            saveFrame(animationid);
        }
    });

    // Add to tabs
    tabs.push({
        image: 5205,
        widgets: widgets
    })
    widgets = []

    // Objects tab

    widgets.push({
        type: 'label',
        name: 'objectlistlabel',
        x: 5,
        y: 70,
        width: 150,
        height: 15,
        text: "Objects in Frame"
    });

    widgets.push({
        type: 'button',
        name: "SelectObject",
        x: 155,
        y: 65,
        width: 40,
        height: 20,
        text: "Add",
        onClick: function onClick() {
            if (addCarTool) {
                ui.showError("error:", "stop adding cars first.")
                return
            }

            if (addObjectTool) {
                if (ui.tool) {
                    ui.tool.cancel()
                }

                getFrameWindow().findWidget("SelectObject").text = "Add"
                addObjectTool = false
            }
            else {
                ui.activateTool({
                    id: "RCTAnimatorObjectSelector",
                    cursor: "cross_hair",
                    filter: ["terrain", "ride", "footpath", "footpath_item", "scenery", "large_scenery", "wall", "banner"],
                    onDown: function (e) {
                        if (e.tileElementIndex != null) {
                            addObject(animationid, frame.Id, (e.mapCoords.x / 32), (e.mapCoords.y / 32), e.tileElementIndex, true);
                        }
                        frameWindowObjectList(frame);
                    }
                })

                getFrameWindow().findWidget("SelectObject").text = "Stop"
                addObjectTool = true
            }
        }
    });

    widgets.push({
        type: 'button',
        name: "SelectObjectEx",
        x: 110,
        y: 46,
        width: 85,
        height: 18,
        text: "TileExplorer",
        onClick: function onClick() {
            tileEditWindow(animationid, frame);
        }
    });

    widgets.push({
        type: 'listview',
        name: 'objectlist',
        x: 5,
        y: 90,
        width: 190,
        height: 100,
        scrollbars: "vertical",
        isStriped: true,
        showColumnHeaders: true,
        columns: [
            {
                canSort: true,
                header: "ID",
                ratioWidth: 1,
                sortOrder: "ascending"
            },
            {
                canSort: true,
                header: "X",
                ratioWidth: 1,
                sortOrder: "ascending"
            },
            {
                canSort: true,
                header: "Y",
                ratioWidth: 1,
                sortOrder: "ascending"
            },
            {
                canSort: true,
                header: "Z",
                ratioWidth: 1,
                sortOrder: "ascending"
            },
            {
                canSort: true,
                header: "Name",
                ratioWidth: 6,
                sortOrder: "ascending"
            }
        ],
        items: [],
        selectedCell: 0,
        canSelect: true,
        onClick: function onClick(item, column) {
            // Show the element on the map
            if (ghostobjects.length = 1) {
                var ghostmapobject = map.getTile(ghostobjects[0].x, ghostobjects[0].y).getElement(ghostobjects[0].element)
                if (ghostmapobject) {
                    ghostmapobject.isGhost = false;
                }
            }
            var element = frame.Elements[item]
            var elementid = getMapElementId(element);
            if (elementid == null) {
                ui.showError("error:", "can't find object")
                return
            }
            var mapelement = map.getTile(element.TileX, element.TileY).getElement(elementid)
            //If the element used to be the ghost element don't reapply it
            if ((ghostobjects[0].x != element.TileX) && (ghostobjects[0].y != element.TileY) && (ghostobjects[0].element != elementid)) {
                mapelement.isGhost = true;
                ghostobjects = [
                    {
                        x: element.TileX,
                        y: element.TileY,
                        element: elementid
                    }
                ]
            }
            else {
                ghostobjects = [
                    {
                        x: -1,
                        y: -1,
                        element: -1
                    }
                ]
            }

            // Set the action settings
            frameWindowSetObjectInfo(element);
        }
    });

    widgets.push({
        type: 'button',
        name: "RemoveObject",
        x: 120,
        y: 195,
        width: 75,
        height: 20,
        text: "Del Selected",
        onClick: function onClick() {
            removeObject(animationid, frame.Id, frameWindowGetSelectedObjectId());
            frameWindowObjectList(frame);

            if (ghostobjects.length = 1) {
                var ghostmapobject = map.getTile(ghostobjects[0].x, ghostobjects[0].y).getElement(ghostobjects[0].element)
                if (ghostmapobject) {
                    ghostmapobject.isGhost = false;
                }
            }
        }
    });

    widgets.push({
        type: 'label',
        name: 'objectlabel',
        x: 5,
        y: 200,
        width: 150,
        height: 15,
        text: "Object Action(s):",
        onChange: function () {
            frameWindowSaveObject(animationid, frame.Id, frameWindowGetSelectedObjectId(), true);
        }
    });

    widgets.push({
        type: 'checkbox',
        name: 'objectActionRaiseLowerCheckBox',
        isDisabled: true,
        x: 5,
        y: 220,
        width: 90,
        height: 15,
        isChecked: false,
        text: "Raise/Lower",
        onChange: function () {
            frameWindowSaveObject(animationid, frame.Id, frameWindowGetSelectedObjectId(), true);
        }
    });

    widgets.push({
        type: "spinner",
        name: "objectActionRaiseLowerSpinner",
        isDisabled: true,
        x: 95,
        y: 220,
        width: 100,
        height: 15,
        text: "0 Units",
        onDecrement: function onDecrement(e) {
            // Set the checkbox to active
            getFrameWindow().findWidget('objectActionRaiseLowerCheckBox').isChecked = true;
            // Set the height
            getFrameWindow().findWidget("objectActionRaiseLowerSpinner").text = +(getFrameWindow().findWidget("objectActionRaiseLowerSpinner").text.split(" ")[0]) - 0.5 + " Units";
            // Save the changes
            frameWindowSaveObject(animationid, frame.Id, frameWindowGetSelectedObjectId(), true);
        },
        onIncrement: function onIncrement(e) {
            // Set the checkbox to active
            getFrameWindow().findWidget('objectActionRaiseLowerCheckBox').isChecked = true;
            // Set the height
            getFrameWindow().findWidget("objectActionRaiseLowerSpinner").text = +(getFrameWindow().findWidget("objectActionRaiseLowerSpinner").text.split(" ")[0]) + 0.5 + " Units";
            // Save the changes
            frameWindowSaveObject(animationid, frame.Id, frameWindowGetSelectedObjectId(), true);
        }
    });

    widgets.push({
        type: 'checkbox',
        name: 'objectActionRecolourCheckBox',
        isDisabled: true,
        x: 5,
        y: 240,
        width: 90,
        height: 15,
        isChecked: false,
        text: "Recolour",
        onChange: function () {
            frameWindowSaveObject(animationid, frame.Id, frameWindowGetSelectedObjectId(), true);
        }
    });

    widgets.push({
        type: 'colourpicker',
        name: 'objectActionRecolourPicker1',
        isDisabled: true,
        x: 95,
        y: 240,
        width: 15,
        height: 15,
        colour: 0,
        onChange: function () {
            // Set the checkbox to active
            if (allowsave) {
                getFrameWindow().findWidget('objectActionRecolourCheckBox').isChecked = true;
            }
            // Save the changes
            frameWindowSaveObject(animationid, frame.Id, frameWindowGetSelectedObjectId(), true);
        }
    });

    widgets.push({
        type: 'colourpicker',
        name: 'objectActionRecolourPicker2',
        isDisabled: true,
        x: 115,
        y: 240,
        width: 15,
        height: 15,
        colour: 0,
        onChange: function () {
            // Set the checkbox to active
            if (allowsave) {
                getFrameWindow().findWidget('objectActionRecolourCheckBox').isChecked = true;
            }
            // Save the changes
            frameWindowSaveObject(animationid, frame.Id, frameWindowGetSelectedObjectId(), true);
        }
    });

    widgets.push({
        type: 'colourpicker',
        name: 'objectActionRecolourPicker3',
        isDisabled: true,
        x: 135,
        y: 240,
        width: 15,
        height: 15,
        colour: 0,
        onChange: function () {
            // Set the checkbox to active
            if (allowsave) {
                getFrameWindow().findWidget('objectActionRecolourCheckBox').isChecked = true;
            }
            // Save the changes
            frameWindowSaveObject(animationid, frame.Id, frameWindowGetSelectedObjectId(), true);
        }
    });

    widgets.push({
        type: 'checkbox',
        name: 'objectActionHideCheckBox',
        isDisabled: true,
        x: 5,
        y: 260,
        width: 90,
        height: 15,
        isChecked: false,
        text: "Hide",
        onChange: function () {
            frameWindowSaveObject(animationid, frame.Id, frameWindowGetSelectedObjectId(), true);
        }
    });

    widgets.push({
        type: 'checkbox',
        name: 'objectActionHideCheckBoxValue',
        isDisabled: true,
        x: 95,
        y: 260,
        width: 15,
        height: 15,
        isChecked: false,
        text: "",
        onChange: function () {
            // Set the checkbox to active
            getFrameWindow().findWidget('objectActionHideCheckBox').isChecked = true;
            // Save the changes
            frameWindowSaveObject(animationid, frame.Id, frameWindowGetSelectedObjectId(), true);
        }
    });

    widgets.push({
        type: 'checkbox',
        name: 'objectActionRotateCheckBox',
        isDisabled: true,
        x: 5,
        y: 280,
        width: 90,
        height: 15,
        isChecked: false,
        text: "Rotate",
        onChange: function () {
            frameWindowSaveObject(animationid, frame.Id, frameWindowGetSelectedObjectId(), true);
        }
    });

    widgets.push({
        type: "spinner",
        name: "objectActionRotateSpinner",
        isDisabled: true,
        x: 95,
        y: 280,
        width: 100,
        height: 15,
        text: "0",
        onDecrement: function onDecrement(e) {
            // Set the checkbox to active
            getFrameWindow().findWidget('objectActionRotateCheckBox').isChecked = true;
            // Set the rotation
            var rotate = Number(getFrameWindow().findWidget("objectActionRotateSpinner").text) - 1
            if (rotate < -3) {
                rotate = 0
            }
            getFrameWindow().findWidget("objectActionRotateSpinner").text = rotate.toString();
            // Save the changes
            frameWindowSaveObject(animationid, frame.Id, frameWindowGetSelectedObjectId(), true);
        },
        onIncrement: function onIncrement(e) {
            // Set the checkbox to active
            getFrameWindow().findWidget('objectActionRotateCheckBox').isChecked = true;
            // Set the rotation
            var rotate = Number(getFrameWindow().findWidget("objectActionRotateSpinner").text) + 1
            if (rotate > 3) {
                rotate = 0
            }
            getFrameWindow().findWidget("objectActionRotateSpinner").text = rotate.toString();
            // Save the changes
            frameWindowSaveObject(animationid, frame.Id, frameWindowGetSelectedObjectId(), true);
        }
    });

    widgets.push({
        type: 'button',
        name: "applyAllObjects",
        isDisabled: true,
        x: 5,
        y: 300,
        width: 190,
        height: 20,
        text: "Apply Action Settings to All Objects",
        onClick: function onClick() {
            // All for all objects
            var items = getFrameWindow().findWidget("objectlist").items;

            // Start the progress windows
            progressWindow("Applying Action Settings")

            // Call the function with a slight delay so the window is drawn.
            var timeout = context.setTimeout(function () {
                for (var i = 0; i < items.length; i++) {
                    frameWindowSaveObject(animationid, frame.Id, items[i][0], false);
                }
                // Save the frame
                saveFrame(animationid);
                // clear the timeout
                context.clearTimeout(timeout);
                // Close the window
                getProgressWindow().close();
            }, 1)
        }
    });

    // Add to tabs
    tabs.push({
        image: "hide_scenery",
        widgets: widgets
    })
    widgets = []

    // Objects tab

    widgets.push({
        type: 'label',
        name: 'carlistlabel',
        x: 5,
        y: 70,
        width: 150,
        height: 15,
        text: "Cars in Frame"
    });

    widgets.push({
        type: 'button',
        name: "SelectCar",
        x: 155,
        y: 65,
        width: 40,
        height: 20,
        text: "Add",
        onClick: function onClick() {
            if (addObjectTool) {
                ui.showError("error:", "stop adding cars first.")
                return
            }

            if (addCarTool) {
                if (ui.tool) {
                    ui.tool.cancel()
                }

                getFrameWindow().findWidget("SelectCar").text = "Add"
                addCarTool = false
            }
            else {
                ui.activateTool({
                    id: "RCTAnimatorCarSelector",
                    cursor: "cross_hair",
                    filter: ["entity"],
                    onDown: function (e) {
                        if (e.entityId != null) {
                            addEntity(animationid, frame.Id, e.entityId, true);
                        }
                        frameWindowCarList(frame);
                    }
                })

                getFrameWindow().findWidget("SelectCar").text = "Stop"
                addCarTool = true
            }
        }
    });

    widgets.push({
        type: 'listview',
        name: 'carlist',
        x: 5,
        y: 90,
        width: 190,
        height: 100,
        scrollbars: "vertical",
        isStriped: true,
        showColumnHeaders: true,
        columns: [
            {
                canSort: true,
                header: "ID",
                ratioWidth: 1,
                sortOrder: "ascending"
            },
            {
                canSort: true,
                header: "Name",
                ratioWidth: 6,
                sortOrder: "ascending"
            }
        ],
        items: [],
        selectedCell: 0,
        canSelect: true,
        onClick: function onClick(item, column) {
            // Set the action settings
            frameWindowSetCarInfo(frame.Cars[item]);
        }
    });

    widgets.push({
        type: 'button',
        name: "RemoveCar",
        x: 120,
        y: 195,
        width: 75,
        height: 20,
        text: "Del Selected",
        onClick: function onClick() {
            removeCar(animationid, frame.Id, frameWindowGetSelectedCarId());
            frameWindowCarList(frame);
        }
    });

    widgets.push({
        type: 'label',
        name: 'carlabel',
        x: 5,
        y: 200,
        width: 150,
        height: 15,
        text: "Object Action(s):",
        onChange: function () {
            frameWindowSaveCar(animationid, frame.Id, frameWindowGetSelectedCarId(), true);
        }
    });

    widgets.push({
        type: 'checkbox',
        name: 'carActionRaiseLowerCheckBox',
        isDisabled: true,
        x: 5,
        y: 220,
        width: 90,
        height: 15,
        isChecked: false,
        text: "Raise/Lower",
        onChange: function () {
            frameWindowSaveCar(animationid, frame.Id, frameWindowGetSelectedCarId(), true);
        }
    });

    widgets.push({
        type: "spinner",
        name: "carActionRaiseLowerSpinner",
        isDisabled: true,
        tooltip: "8 is equal to half a unit",
        x: 95,
        y: 220,
        width: 100,
        height: 15,
        text: "0 Units",
        onDecrement: function onDecrement(e) {
            // Set the checkbox to active
            getFrameWindow().findWidget('carActionRaiseLowerCheckBox').isChecked = true;
            // Set the height
            getFrameWindow().findWidget("carActionRaiseLowerSpinner").text = (Number(getFrameWindow().findWidget("carActionRaiseLowerSpinner").text) - 1).toString();
            // Save the changes
            frameWindowSaveCar(animationid, frame.Id, frameWindowGetSelectedCarId(), true);
        },
        onIncrement: function onIncrement(e) {
            // Set the checkbox to active
            getFrameWindow().findWidget('carActionRaiseLowerCheckBox').isChecked = true;
            // Set the height
            getFrameWindow().findWidget("carActionRaiseLowerSpinner").text = (Number(getFrameWindow().findWidget("carActionRaiseLowerSpinner").text) + 1).toString();
            // Save the changes
            frameWindowSaveCar(animationid, frame.Id, frameWindowGetSelectedCarId(), true);
        }
    });

    widgets.push({
        type: 'checkbox',
        name: 'carActionRecolourCheckBox',
        isDisabled: true,
        x: 5,
        y: 240,
        width: 90,
        height: 15,
        isChecked: false,
        text: "Recolour",
        onChange: function () {
            frameWindowSaveCar(animationid, frame.Id, frameWindowGetSelectedCarId(), true);
        }
    });

    widgets.push({
        type: 'colourpicker',
        name: 'carActionRecolourPicker1',
        isDisabled: true,
        x: 95,
        y: 240,
        width: 15,
        height: 15,
        colour: 0,
        onChange: function () {
            // Set the checkbox to active
            if (allowsave) {
                getFrameWindow().findWidget('carActionRecolourCheckBox').isChecked = true;
            }
            // Save the changes
            frameWindowSaveCar(animationid, frame.Id, frameWindowGetSelectedCarId(), true);
        }
    });

    widgets.push({
        type: 'colourpicker',
        name: 'carActionRecolourPicker2',
        isDisabled: true,
        x: 115,
        y: 240,
        width: 15,
        height: 15,
        colour: 0,
        onChange: function () {
            // Set the checkbox to active
            if (allowsave) {
                getFrameWindow().findWidget('carActionRecolourCheckBox').isChecked = true;
            }
            // Save the changes
            frameWindowSaveCar(animationid, frame.Id, frameWindowGetSelectedCarId(), true);
        }
    });

    widgets.push({
        type: 'colourpicker',
        name: 'carActionRecolourPicker3',
        isDisabled: true,
        x: 135,
        y: 240,
        width: 15,
        height: 15,
        colour: 0,
        onChange: function () {
            // Set the checkbox to active
            if (allowsave) {
                getFrameWindow().findWidget('carActionRecolourCheckBox').isChecked = true;
            }
            // Save the changes
            frameWindowSaveCar(animationid, frame.Id, frameWindowGetSelectedCarId(), true);
        }
    });

    widgets.push({
        type: 'checkbox',
        name: 'carActionChangeVehicleCheckbox',
        isDisabled: true,
        x: 5,
        y: 260,
        width: 90,
        height: 15,
        isChecked: false,
        text: "Car Type",
        onChange: function () {
            frameWindowSaveCar(animationid, frame.Id, frameWindowGetSelectedCarId(), true);
        }
    });

    widgets.push({
        type: "textbox",
        name: "carActionChangeVehicleTextbox",
        isDisabled: true,
        x: 95,
        y: 260,
        width: 100,
        height: 15,
        text: "",
        isDisabled: true,
        onChange: function () {
            // Set the checkbox to active
            if (allowsave) {
                getFrameWindow().findWidget('carActionChangeVehicleCheckbox').isChecked = true;
            }
            // Save the settings
            frameWindowSaveCar(animationid, frame.Id, frameWindowGetSelectedCarId(), true);
        }
    });

    widgets.push({
        type: 'checkbox',
        name: 'carActionChangeVariantCheckbox',
        isDisabled: true,
        x: 5,
        y: 280,
        width: 90,
        height: 15,
        isChecked: false,
        text: "Variant Type",
        onChange: function () {
            // Save the settings
            frameWindowSaveCar(animationid, frame.Id, frameWindowGetSelectedCarId(), true);
        }
    });

    widgets.push({
        type: "textbox",
        name: "carActionChangeVariantTextbox",
        isDisabled: true,
        x: 95,
        y: 280,
        width: 100,
        height: 15,
        text: "",
        isDisabled: true,
        onChange: function () {
            // Set the checkbox to active
            if (allowsave) {
                getFrameWindow().findWidget('carActionChangeVariantCheckbox').isChecked = true;
            }
            // Save the settings
            frameWindowSaveCar(animationid, frame.Id, frameWindowGetSelectedCarId(), true);
        }
    });

    widgets.push({
        type: 'button',
        name: "applyAllCars",
        isDisabled: true,
        x: 5,
        y: 320,
        width: 190,
        height: 20,
        text: "Apply Action Settings to All Cars",
        onClick: function onClick() {
            // All for all cars
            var items = getFrameWindow().findWidget("carlist").items;

            // Start the progress windows
            progressWindow("Applying Action Settings")

            // Call the function with a slight delay so the window is drawn.
            var timeout = context.setTimeout(function () {
                for (var i = 0; i < items.length; i++) {
                    frameWindowSaveCar(animationid, frame.Id, items[i][0], false);
                }
                // Save the frame
                saveFrame(animationid);
                // clear the timeout
                context.clearTimeout(timeout);
                // Close the window
                getProgressWindow().close();
            }, 1)
        }
    });

    // Add to tabs
    tabs.push({
        image: "hide_vehicles",
        widgets: widgets
    })
    widgets = []

    // Create the window
    window = ui.openWindow({
        classification: 'RctAnimationManagerFrameEdit',
        title: "Edit Frame",
        width: 200,
        height: 350,
        x: 5,
        y: 30,
        colours: [12, 12],
        tabs: tabs,
        tabIndex: 1,
        onClose: function () {
            ghostobjects.map(function (ghostobject) {
                var ghostmapobject = map.getTile(ghostobject.x, ghostobject.y).getElement(ghostobject.element)
                if (ghostmapobject) {
                    ghostmapobject.isGhost = false;
                }
            })

            if (getTileWindow()) {
                getTileWindow().close();
            }
            restoreMainWindow()
        },
        onTabChange: function () {
            // Update the lists
            frameWindowObjectList(frame);
            frameWindowCarList(frame);
        }
    });

    frameWindowObjectList(frame);
    frameWindowCarList(frame);
}

function tileEditWindow(animationid, frame) {
    var widgets = []

    // Vars
    var tileX1 = -1;
    var tileY1 = -1;
    var tileX2 = -1;
    var tileY2 = -1;
    var selecting = false;
    var ghostobjects = [];

    // Start a tool
    ui.activateTool({
        id: "RCTAnimatorObjectSelector",
        cursor: "cross_hair",
        filter: ["terrain"],
        onDown: function (e) {
            // Store the coords at the first click
            tileX1 = (e.mapCoords.x / 32);
            tileY1 = (e.mapCoords.y / 32);
            // Start selecting
            selecting = true;
        },
        onMove: function (e) {
            // Temp variables
            var tx1, tx2, ty1, ty2

            if ((e.mapCoords.x / 32) > tileX1) {
                tx1 = tileX1 * 32;
                tx2 = (e.mapCoords.x);
            }
            else {
                tx2 = tileX1 * 32;
                tx1 = (e.mapCoords.x);
            }
            if ((e.mapCoords.y / 32) > tileY1) {
                ty1 = tileY1 * 32
                ty2 = (e.mapCoords.y);
            }
            else {
                ty2 = tileY1 * 32;
                ty1 = (e.mapCoords.y);
            }
            // Check if selecting
            if (selecting) {
                ui.tileSelection.range = {
                    leftTop: {
                        x: tx1,
                        y: ty1
                    },
                    rightBottom: {
                        x: tx2,
                        y: ty2
                    }
                }
            }
        },
        onUp: function (e) {
            // Store the coords when the click is released
            if ((e.mapCoords.x / 32) > tileX1) {
                tileX2 = (e.mapCoords.x / 32);
            }
            else {
                tileX2 = tileX1;
                tileX1 = (e.mapCoords.x / 32);
            }
            if ((e.mapCoords.y / 32) > tileY1) {
                tileY2 = (e.mapCoords.y / 32);
            }
            else {
                tileY2 = tileY1;
                tileY1 = (e.mapCoords.y / 32);
            }

            // Refresh the objectlist
            tileWindowObjectList(tileX1, tileX2, tileY1, tileY2);

            // Set the tile selection
            ui.tileSelection.range = {
                leftTop: {
                    x: tileX1 * 32,
                    y: tileY1 * 32
                },
                rightBottom: {
                    x: tileX2 * 32,
                    y: tileY2 * 32
                }
            }
            // done selecting
            selecting = false
        },
        onFinish: function (e) {
            ui.tileSelection.tiles = []
        }
    })

    // Filters
    widgets.push({
        type: 'label',
        name: 'filterZlabel',
        x: 5,
        y: 20,
        width: 150,
        height: 15,
        text: "Filter Z:"
    });

    widgets.push({
        type: "spinner",
        name: "filterZlower",
        x: 55,
        y: 18,
        width: 50,
        height: 15,
        tooltip: "a value of 14 is equal to unit height 0 (normal land height).",
        text: "0",
        onDecrement: function onDecrement(e) {
            var fnum = Number(getTileWindow().findWidget("filterZlower").text);
            fnum = fnum - 1;
            if (fnum < 0) {
                fnum = 0
            }
            getTileWindow().findWidget("filterZlower").text = fnum.toString();

            // Refresh the objectlist
            tileWindowObjectList(tileX1, tileX2, tileY1, tileY2);
        },
        onIncrement: function onIncrement(e) {
            var fnum = Number(getTileWindow().findWidget("filterZlower").text);
            fnum = fnum + 1;
            if (fnum > 255) {
                fnum = 255
            }
            getTileWindow().findWidget("filterZlower").text = fnum.toString();

            // Refresh the objectlist
            tileWindowObjectList(tileX1, tileX2, tileY1, tileY2);
        },
        onClick: function onClick() {
            ui.showTextInput({
                title: "Lower Z Value",
                description: "What is the lower z value (provide a number between 0 and 255)",
                callback: function (fnum) {
                    getTileWindow().findWidget("filterZlower").text = fnum.toString();

                    // Refresh the objectlist
                    tileWindowObjectList(tileX1, tileX2, tileY1, tileY2);
                }
            })
        }
    });

    widgets.push({
        type: "spinner",
        name: "filterZupper",
        x: 110,
        y: 18,
        width: 50,
        height: 15,
        tooltip: "a value of 14 is equal to unit height 0 (normal land height).",
        text: "255",
        onDecrement: function onDecrement(e) {
            var fnum = Number(getTileWindow().findWidget("filterZupper").text);
            fnum = fnum - 1;
            if (fnum < 0) {
                fnum = 0
            }
            getTileWindow().findWidget("filterZupper").text = fnum.toString();

            // Refresh the objectlist
            tileWindowObjectList(tileX1, tileX2, tileY1, tileY2);
        },
        onIncrement: function onIncrement(e) {
            var fnum = Number(getTileWindow().findWidget("filterZupper").text);
            fnum = fnum + 1;
            if (fnum > 255) {
                fnum = 255
            }
            getTileWindow().findWidget("filterZupper").text = fnum.toString();

            // Refresh the objectlist
            tileWindowObjectList(tileX1, tileX2, tileY1, tileY2);
        },
        onClick: function onClick() {
            ui.showTextInput({
                title: "Upper Z Value",
                description: "What is the upper z value (provide a number between 0 and 255)",
                callback: function (fnum) {
                    getTileWindow().findWidget("filterZupper").text = fnum.toString();

                    // Refresh the objectlist
                    tileWindowObjectList(tileX1, tileX2, tileY1, tileY2);
                }
            })
        }
    });

    widgets.push({
        type: "dropdown",
        name: "filterVisible",
        x: 165,
        y: 18,
        width: 80,
        height: 15,
        items: ["Show All", "Visible Only", "Hidden Only"],
        selectedIndex: 0,
        onChange: function () {
            // Refresh the objectlist
            tileWindowObjectList(tileX1, tileX2, tileY1, tileY2);
        }
    });

    widgets.push({
        type: 'button',
        name: "highlightallobjects",
        x: 255,
        y: 18,
        width: 90,
        height: 15,
        text: "Highlight All",
        onClick: function onClick() {
            // Get the text of the button
            var btext = getTileWindow().findWidget("highlightallobjects").text

            // Make all objects a ghost
            if (btext == "Highlight All") {
                // Set the text of the button
                getTileWindow().findWidget("highlightallobjects").text = "Remove Highlight"

                // Don't add objects while the highlight is active so disable the buttons
                getTileWindow().findWidget("addToFrame").isDisabled = true
                getTileWindow().findWidget("addAllToFrame").isDisabled = true

                // Start the progress windows
                progressWindow("Hightlighting objects")

                // Call the function with a slight delay so the window is drawn.
                var timeout = context.setTimeout(function () {
                    getTileWindow().findWidget("objectlist").items.map(function (object) {
                        map.getTile(Number(object[1]), Number(object[2])).getElement(Number(object[4])).isGhost = true;
                        ghostobjects.push({
                            x: Number(object[1]),
                            y: Number(object[2]),
                            element: Number(object[4])
                        })
                    })
                    // clear the timeout
                    context.clearTimeout(timeout);
                    // Close the window
                    getProgressWindow().close();
                }, 1)
            }
            else {
                // Set the text of the button
                getTileWindow().findWidget("highlightallobjects").text = "Highlight All"

                // Allow adding again so enable the buttons
                getTileWindow().findWidget("addToFrame").isDisabled = false
                getTileWindow().findWidget("addAllToFrame").isDisabled = false

                // Start the progress windows
                progressWindow("Removing highlight")

                // Call the function with a slight delay so the window is drawn.
                var timeout = context.setTimeout(function () {
                    ghostobjects.map(function (object) {
                        map.getTile(object.x, object.y).getElement(object.element).isGhost = false;
                    })
                    // Clear the ghost object array
                    ghostobjects = []
                    // clear the timeout
                    context.clearTimeout(timeout);
                    // Close the window
                    getProgressWindow().close();
                }, 1)
            }
        }
    });

    widgets.push({
        type: 'label',
        name: 'filterTypelabel',
        x: 350,
        y: 20,
        width: 150,
        height: 15,
        text: "Filter Type:"
    });

    widgets.push({
        type: 'checkbox',
        name: "filterSurfaceCheckbox",
        x: 350,
        y: 32,
        width: 15,
        height: 15,
        isChecked: false,
        text: "",
        onChange: function () {
            tileWindowObjectList(tileX1, tileX2, tileY1, tileY2);
        }
    });

    widgets.push({
        type: 'label',
        name: 'filterSurfaceLabel',
        x: 365,
        y: 34,
        width: 95,
        height: 15,
        text: "Surface"
    });

    widgets.push({
        type: 'checkbox',
        name: "filterSmallSceneryCheckbox",
        x: 350,
        y: 46,
        width: 15,
        height: 15,
        isChecked: false,
        text: "",
        onChange: function () {
            tileWindowObjectList(tileX1, tileX2, tileY1, tileY2);
        }
    });

    widgets.push({
        type: 'label',
        name: 'filterSmallsceneryLabel',
        x: 365,
        y: 48,
        width: 95,
        height: 15,
        text: "Small Scenery"
    });

    widgets.push({
        type: 'checkbox',
        name: "filterLargeSceneryCheckbox",
        x: 350,
        y: 60,
        width: 15,
        height: 15,
        isChecked: false,
        text: "",
        onChange: function () {
            tileWindowObjectList(tileX1, tileX2, tileY1, tileY2);
        }
    });

    widgets.push({
        type: 'label',
        name: 'filterLargeSceneryLabel',
        x: 365,
        y: 62,
        width: 95,
        height: 15,
        text: "Large Scenery"
    });

    widgets.push({
        type: 'checkbox',
        name: "filterWallCheckbox",
        x: 350,
        y: 74,
        width: 15,
        height: 15,
        isChecked: false,
        text: "",
        onChange: function () {
            tileWindowObjectList(tileX1, tileX2, tileY1, tileY2);
        }
    });

    widgets.push({
        type: 'label',
        name: 'filterWallLabel',
        x: 365,
        y: 76,
        width: 95,
        height: 15,
        text: "Wall"
    });

    widgets.push({
        type: 'checkbox',
        name: "filterTrackCheckbox",
        x: 350,
        y: 88,
        width: 15,
        height: 15,
        isChecked: false,
        text: "",
        onChange: function () {
            tileWindowObjectList(tileX1, tileX2, tileY1, tileY2);
        }
    });

    widgets.push({
        type: 'label',
        name: 'filterTrackLabel',
        x: 365,
        y: 90,
        width: 95,
        height: 15,
        text: "Track"
    });

    widgets.push({
        type: 'checkbox',
        name: "filterEntranceCheckbox",
        x: 350,
        y: 102,
        width: 15,
        height: 15,
        isChecked: false,
        text: "",
        onChange: function () {
            tileWindowObjectList(tileX1, tileX2, tileY1, tileY2);
        }
    });

    widgets.push({
        type: 'label',
        name: 'filterEntraceLabel',
        x: 365,
        y: 104,
        width: 95,
        height: 15,
        text: "Entrance/Exit"
    });

    widgets.push({
        type: 'checkbox',
        name: "filterFootpathCheckbox",
        x: 350,
        y: 116,
        width: 15,
        height: 15,
        isChecked: false,
        text: "",
        onChange: function () {
            tileWindowObjectList(tileX1, tileX2, tileY1, tileY2);
        }
    });

    widgets.push({
        type: 'label',
        name: 'filterFootpathLabel',
        x: 365,
        y: 118,
        width: 95,
        height: 15,
        text: "Footpath"
    });

    widgets.push({
        type: 'checkbox',
        name: "filterBannerCheckbox",
        x: 350,
        y: 130,
        width: 15,
        height: 15,
        isChecked: false,
        text: "",
        onChange: function () {
            tileWindowObjectList(tileX1, tileX2, tileY1, tileY2);
        }
    });

    widgets.push({
        type: 'label',
        name: 'filterBannerLabel',
        x: 365,
        y: 132,
        width: 95,
        height: 15,
        text: "Banner"
    });

    // List objects on tile
    widgets.push({
        type: 'listview',
        name: 'objectlist',
        x: 5,
        y: 35,
        width: 340,
        height: 92,
        scrollbars: "vertical",
        isStriped: true,
        showColumnHeaders: true,
        columns: [
            {
                canSort: false,
                header: "Vis",
                ratioWidth: 1
            },
            {
                canSort: false,
                header: "X",
                ratioWidth: 1
            },
            {
                canSort: false,
                header: "Y",
                ratioWidth: 1
            },
            {
                canSort: false,
                header: "Z",
                ratioWidth: 1
            },
            {
                canSort: false,
                header: "#",
                ratioWidth: 1
            },
            {
                canSort: true,
                header: "Object",
                ratioWidth: 8,
                sortOrder: "ascending"
            }
        ],
        items: [],
        selectedCell: 0,
        canSelect: true
    });

    widgets.push({
        type: 'button',
        name: "addToFrame",
        x: 5,
        y: 130,
        width: 165,
        height: 15,
        text: "Add Selected Object to Frame",
        onClick: function onClick() {
            addObject(animationid, frame.Id, Number(tileWindowGetSelectedObjectX()), Number(tileWindowGetSelectedObjectY()), Number(tileWindowGetSelectedObjectIndex()), true);
            frameWindowObjectList(frame);
        }
    });

    widgets.push({
        type: 'button',
        name: "addAllToFrame",
        x: 180,
        y: 130,
        width: 165,
        height: 15,
        text: "Add All Objects to Frame",
        onClick: function onClick() {
            // Start the progress windows
            progressWindow("Adding Objects")

            // Call the function with a slight delay so the window is drawn.
            var timeout = context.setTimeout(function () {
                getTileWindow().findWidget("objectlist").items.map(function (object) {
                    addObject(animationid, frame.Id, Number(object[1]), Number(object[2]), Number(object[4]), false);
                })
                // Save the newly frame info
                saveFrame(animationid);
                // clear the timeout
                context.clearTimeout(timeout);
                // Close the window
                getProgressWindow().close();
                // Update the objectlist
                frameWindowObjectList(frame);
            }, 1)
        }
    });

    // Create the window
    window = ui.openWindow({
        classification: 'RctAnimationManagerTileEdit',
        title: "Tile Explorer",
        width: 450,
        height: 150,
        x: 210,
        y: 30,
        colours: [12, 12],
        widgets: widgets,
        onClose: function () {
            // Close the tool
            if (ui.tool) {
                ui.tool.cancel()
            }
        }
    });
}

// Progress Window
function progressWindow(description) {
    var widgets = []

    widgets.push({
        type: 'label',
        name: 'progressLabel',
        x: 5,
        y: 20,
        width: 190,
        height: 15,
        text: description
    });

    window = ui.openWindow({
        classification: 'RctAnimationManagerProgress',
        title: "Please Wait",
        width: 200,
        height: 40,
        x: 300,
        y: 300,
        colours: [12, 12],
        widgets: widgets
    });
}

// Main function
var main = function () {
    // Add a menu item under the map icon on the top toolbar
    ui.registerMenuItem("RCT Animation Manager", function () {
        mainWindow();
    });
};

// Register the plugin
registerPlugin({
    name: 'RCTAnimator Manager',
    version: '0.6',
    authors: ['AutoSysOps (Levis)'],
    type: 'remote',
    licence: 'MIT',
    targetApiVersion: 84,
    main: main
});
// Global vars
var waitTimes = {}
var framesRemaining = {}
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

// Main function
var main = function () {
    context.registerAction(
        "RCTAnimation.nextFrame",
        function queryFunction(e) {
            return {}
        },
        function executeAction(e) {
            /* Arguments
            {
                animationId: <int>
            }
            */
            if (e.args.animationId == null) {
                return {
                    error: 1,
                    errorTitle: "missing args",
                    errorMessage: "animationId must be provided in the eventargs."
                }
            }

            var animation = getAnimationById(e.args.animationId);

            // Determine the nextframe
            var nextFrame = animation.CurrentFrame + 1
            if (nextFrame >= animation.Frames.length) {
                nextFrame = 0
            }

            // Get the frame
            var frame = animation.Frames[nextFrame]
            var mapelementId = 0;
            var carid = 0;
            var mapElement;
            var len = frame.Elements.length

            // Loop through all Objects in the frame and perform their actions
            for (var i = 0; i < len; i++) {
                try {
                    mapelementId = getMapElementId(frame.Elements[i]);

                    // Raise/Lower
                    if (frame.Elements[i].Action.RaiseLower) {
                        map.getTile(frame.Elements[i].TileX, frame.Elements[i].TileY).elements[mapelementId].baseHeight += frame.Elements[i].Action.Offset
                    }

                    // Recolour
                    if (frame.Elements[i].Action.Recolour) {
                        mapElement = map.getTile(frame.Elements[i].TileX, frame.Elements[i].TileY).elements[mapelementId];
                        mapElement.primaryColour = frame.Elements[i].Action.PrimaryColour
                        mapElement.secondaryColour = frame.Elements[i].Action.SecondaryColour
                        mapElement.tertiaryColour = frame.Elements[i].Action.TertiaryColour
                    }

                    // Hide/Show
                    if (frame.Elements[i].Action.HideShow) {
                        map.getTile(frame.Elements[i].TileX, frame.Elements[i].TileY).elements[mapelementId].isHidden = frame.Elements[i].Action.Hidden
                    }

                    // Rotate
                    if (frame.Elements[i].Action.Rotate) {
                        mapElement = map.getTile(frame.Elements[i].TileX, frame.Elements[i].TileY).elements[mapelementId];
                        mapElement.direction = Number(mapElement.direction) + Number(frame.Elements[i].Action.RotateBy)
                    }
                }
                catch (e) {

                }
            }

            // Loop through all Cars in the frame and perform their actions
            len = frame.Cars.length
            var entity
            for (i = 0; i < len; i++) {
                carid = getCarId(frame.Cars[i]);

                // Raise/Lower
                if (frame.Cars[i].Action.RaiseLower) {
                    entity = map.getEntity(carid).z += frame.Cars[i].Action.Offset
                }

                // Recolour
                if (frame.Cars[i].Action.Recolour) {
                    entity = map.getEntity(carid);
                    entity.colours = {
                        body: frame.Cars[i].Action.BodyColour,
                        trim: frame.Cars[i].Action.TrimColour,
                        tertiary: frame.Cars[i].Action.TertiaryColour
                    }
                }

                // Vehicle
                if (frame.Cars[i].Action.ChangeVehicle) {
                    entity = map.getEntity(carid).rideObject = frame.Cars[i].Action.VehicleObject
                }

                // Variant
                if (frame.Cars[i].Action.ChangeVariant) {
                    entity = map.getEntity(carid).vehicleObject = frame.Cars[i].Action.VariantType
                }
            }

            // Check if the camera needs to be moved
            if (frame.MoveCamera) {
                ui.mainViewport.zoom = Number(frame.MoveZoom)
                ui.mainViewport.rotation = Number(frame.MoveRotation)
                ui.mainViewport.scrollTo({ x: Number(frame.MoveX), y: Number(frame.MoveY) })
            }

            animation.CurrentFrame = nextFrame

            return {}
        }
    )

    // Register action to recheck buttons
    context.registerAction(
        "RCTAnimation.checkButtons",
        function queryFunction(e) {
            return {}
        },
        function executeAction(e) {
            checkButtons();
            return {};
        }
    )

    // Register the hook to check every gametick
    context.subscribe('interval.tick', function runCheck(e) {
        checkAnimations();
    });

    // Check for buttons on load
    checkButtons();
};

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

// Runtime Functions

function checkAnimations() {
    var animations = getAnimations();
    // Check every animation
    var currentFrame = 0
    var mapentities, triggernum, entitynum, traininfo
    var aninum = animations.Animations.length
    for (var i = 0; i < aninum; i++) {
        // Check if animation is Active
        if (animations.Animations[i].Active) {
            // Check all triggers
            triggernum = animations.Animations[i].Triggers.length
            for (var j = 0; j < triggernum; j++) {
                // Check if trigger is continues or if frames remaining is set for this animation
                if (animations.Animations[i].Triggers[j].Type == "continues" || framesRemaining[animations.Animations[i].Id] > 0) {
                    // Check the wait time
                    if (waitTimes[animations.Animations[i].Id]) {
                        // Decrement the wait time
                        waitTimes[animations.Animations[i].Id]--

                        // If the wait time is over proceed to the next fram
                        if (waitTimes[animations.Animations[i].Id] <= 0) {
                            context.executeAction('RCTAnimation.nextFrame', { animationId: animations.Animations[i].Id, flags: 0 })

                            // Set the new wait time
                            currentFrame = animations.Animations[i].CurrentFrame
                            waitTimes[animations.Animations[i].Id] = animations.Animations[i].Frames[currentFrame].Delay

                            // If remaining frames are set remove one
                            if (framesRemaining[animations.Animations[i].Id]) {
                                framesRemaining[animations.Animations[i].Id]--
                            }
                        }
                    }
                    else {
                        // If the wait time isn't set then set it.
                        waitTimes[animations.Animations[i].Id] = animations.Animations[i].Frames[currentFrame].Delay
                        if (animations.Animations[i].Triggers[j].ContinuesStartDelay) {
                            waitTimes[animations.Animations[i].Id] = animations.Animations[i].Triggers[j].ContinuesStartDelay
                        }
                    }
                }

                // Check of the trigger is carOnTrack if so check if the conditions are met
                if (animations.Animations[i].Triggers[j].Type == "carOnTrack") {
                    // Check if no frames are remaining for the animation
                    if (!framesRemaining[animations.Animations[i].Id] || framesRemaining[animations.Animations[i].Id] == 0) {
                        mapentities = map.getAllEntitiesOnTile("car", { x: animations.Animations[i].Triggers[j].CarOnTrackX, y: animations.Animations[i].Triggers[j].CarOnTrackY })
                        // Check all the entities found
                        entitynum = mapentities.length
                        for (var k = 0; k < entitynum; k++) {
                            // Check Ride
                            if (mapentities[k].ride != animations.Animations[i].Triggers[j].CarOnTrackRide) {
                                continue
                            }

                            // Check Z
                            if (mapentities[k].trackLocation.z != animations.Animations[i].Triggers[j].CarOnTrackZ) {
                                continue
                            }

                            // Check D
                            if (mapentities[k].trackLocation.direction != animations.Animations[i].Triggers[j].CarOnTrackD) {
                                continue
                            }

                            // Check the Train (skip if set to -1)
                            traininfo = null
                            if (animations.Animations[i].Triggers[j].CarOnTrackTrain != -1) {
                                traininfo = getCarTrainInfo(mapentities[k].id)

                                if (traininfo.train != animations.Animations[i].Triggers[j].CarOnTrackTrain) {
                                    continue
                                }
                            }

                            // Check the Car (skip if set to -1)
                            if (animations.Animations[i].Triggers[j].CarOnTrackCar != -1) {
                                if (traininfo) {
                                    traininfo = getCarTrainInfo(mapentities[k].id)
                                }

                                if (traininfo.car != animations.Animations[i].Triggers[j].CarOnTrackCar) {
                                    continue
                                }
                            }

                            // Set how many frames need to be played based on the delay they will be played
                            framesRemaining[animations.Animations[i].Id] = animations.Animations[i].Triggers[j].FramesToPlay
                        }
                    }
                }
            }
        }
        else {
            // If the animation is not active and a waittime is set remove this
            waitTimes[animations.Animations[i].Id] = null
        }
    }
}

// Check if a menu has to be constructed
function checkButtons() {
    var animations = getAnimations();
    // Check every animation
    var buttons = []
    var framestoplay = 1
    for (var i = 0; i < animations.Animations.length; i++) {
        // Check if animation is Active
        if (animations.Animations[i].Active) {
            // Check all triggers
            for (var j = 0; j < animations.Animations[i].Triggers.length; j++) {
                // Check if trigger is button
                if (animations.Animations[i].Triggers[j].Type == "button") {
                    // Get the amount of frames to play (for backwards compatability this check is added)
                    framestoplay = 1
                    if (animations.Animations[i].Triggers[j].FramesToPlay) {
                        framestoplay = animations.Animations[i].Triggers[j].FramesToPlay
                    }
                    // Add the button info
                    buttons.push({
                        Name: animations.Animations[i].Triggers[j].ButtonName,
                        Pos: animations.Animations[i].Triggers[j].ButtonPos,
                        Exclusive: animations.Animations[i].Triggers[j].ButtonExclusive,
                        KeepPressed: animations.Animations[i].Triggers[j].ButtonKeepPressed,
                        AnimationId: animations.Animations[i].Id,
                        PlayFrames: framestoplay
                    })
                }
            }
        }
    }
    if (buttons.length > 0) {
        // Open the menu
        buttonMenu(buttons)

        // Add a option to the plugin menu to reopen the menu in case you close it
        ui.registerMenuItem("RCT Animation Menu", function () {
            buttonMenu(buttons)
        });
    }
    else {
        // Check if the menu already exists, if so close it
        if (ui.getWindow("RctAnimationRuntimeButtonWindow")) {
            ui.getWindow("RctAnimationRuntimeButtonWindow").close()
        }
    }
}

function getButtonCallbackFunction(id, exclusive, keepressed, buttonnum, totalbuttonnum, playframes) {
    return function () {
        // If keeppressed is set check for exclusivity
        if (keepressed) {
            // Hide or show buttons depending on if exclusitivity is set
            if (ui.getWindow("RctAnimationRuntimeButtonWindow").findWidget("Button" + buttonnum).isPressed) {
                ui.getWindow("RctAnimationRuntimeButtonWindow").findWidget("Button" + buttonnum).isPressed = false

                if (exclusive) {
                    for (var i = 0; i < totalbuttonnum; i++) {
                        if (ui.getWindow("RctAnimationRuntimeButtonWindow").findWidget("Button" + i)) {
                            ui.getWindow("RctAnimationRuntimeButtonWindow").findWidget("Button" + i).isVisible = true
                        }
                    }
                }
            }
            else {
                ui.getWindow("RctAnimationRuntimeButtonWindow").findWidget("Button" + buttonnum).isPressed = true

                if (exclusive) {
                    for (var i = 0; i < totalbuttonnum; i++) {
                        if (i != buttonnum) {
                            if (ui.getWindow("RctAnimationRuntimeButtonWindow").findWidget("Button" + i)) {
                                ui.getWindow("RctAnimationRuntimeButtonWindow").findWidget("Button" + i).isVisible = false
                            }
                        }
                    }
                }
            }
        }

        // Set how many frames need to be played based on the delay they will be played
        framesRemaining[id] = playframes
    }
}

// Button Menu
function buttonMenu(buttons) {
    var widgets = []
    var maxpos = 0

    for (var i = 0; i < buttons.length; i++) {
        // Create a button
        widgets.push({
            type: 'button',
            name: "Button" + i,
            x: 5,
            y: 20 + ((buttons[i].Pos - 1) * 25),
            width: 140,
            height: 20,
            isPressed: false,
            text: buttons[i].Name,
            onClick: getButtonCallbackFunction(buttons[i].AnimationId, buttons[i].Exclusive, buttons[i].KeepPressed, i, buttons.length, buttons[i].PlayFrames)
        });

        if (buttons[i].Pos > maxpos) {
            maxpos = buttons[i].Pos
        }
    }

    // Check if the menu already exists, if so close it
    if (ui.getWindow("RctAnimationRuntimeButtonWindow")) {
        ui.getWindow("RctAnimationRuntimeButtonWindow").close()
    }

    // Create the window
    window = ui.openWindow({
        classification: 'RctAnimationRuntimeButtonWindow',
        title: "Animations (by Levis)",
        isSticky: true,
        width: 150,
        height: (maxpos * 25) + 25,
        x: 0,
        y: 25,
        colours: [7, 7],
        widgets: widgets
    });
}

// Register the plugin
registerPlugin({
    name: 'RCTAnimator Runtime',
    version: '0.6',
    authors: ['AutoSysOps (Levis)'],
    type: 'remote',
    licence: 'MIT',
    targetApiVersion: 84,
    main: main
});
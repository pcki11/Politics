var ValueFormatter = function(){
	var notations = [
		'k',
		'M',
		'B',
		'T',
		'Qa',
		'Qi',
		'Sx',
		'Sp',
		'Oc',
		'No',
		'Dc',
		'UnD',
		'DoD',
		'TrD',
		'QaD',
		'QiD'
	];
	this.format = function(value) {
		var base = 0, notationValue = '';
		if(value >= 1000 && isFinite(value)) {
			value /= 1000;
			while(Math.round(value) >= 1000 && base < notations.length - 1) {
				value /= 1000;
				base++;
			}
			notationValue = notations[base];
		}
		return (Math.round(value * 100) / 100) + notationValue;
	};
};
var Resource = function(settings){
	var me = this;
	var count = 0;
	this.name = settings.name;
	this.tick = function() {
		count += settings.increment;
	};
	this.add = function(resource) {
		if(me.name == resource.name) {
			count += resource.count();
		}
	};
	this.count = function() {
		return count;
	};
};
var Action = function(settings) {
	var me = this;
	this.name = settings.name;
	this.actions = settings.actions;
};
var Property = function(settings) {
	var me = this;
	var tier = 0;
	this.name = settings.name;
	this.value = function(){
		return settings.values[tier];
	};
	this.upgrade = function() {
		tier++;
	};
	this.tick = function() {
		var chance = Math.random(1);
		if(chance < settings.chance) {
			return settings.outcome(tier);
		} else {
			//console.log(settings.name, chance + " > " + settings.chance);
		}
		return {type: "stall"};
	};
};
var leaderProperty = new Property({
	name: "Leader",
	values: ["Primate", "Chief", "King", "Emperor", "President"],
	chance: 0.1,
	outcome: function(tier) {
		if(tier == 0) {
			return [
				{
					type: "resource",
					object: new Resource({
						name: "Food",
						increment: 0.1
					})
				},
				{
					type: "upgrade"
				}
			];
		}
	}
});
var testProperty = new Property({
	name: "Society",
	values: ["Tribe", "Tribe v.2"],
	chance: 0.4,
	outcome: function(tier) {
		if(tier == 0) {
			return [
				{
					type: "action",
					object: new Action({
						name: "Recruit a leader",
						actions: [
							{
								name: "Recruit",
								action: function() {
									return {
										type: "property",
										change: "add",
										object: leaderProperty
									}
								}
							}
						]
					})
				},
				{
					type: "upgrade"
				}
			];
		}
	}
});
var PoliticalSystem = function() {
	var me = this;
	var resources = [];
	var availableActions = [];
	var properties = [];
	this.addResource = function(newResource) {
		var found = false;
		resources.forEach(function(resource) {
			if(resource.name == newResource.name) {
				found = true;
				resource.add(newResource);
			}
		});
		if(!found) {
			resources.push(newResource);
		}
	};
	this.addProperty = function(newProperty) {
		var found = false;
		properties.forEach(function(property) {
			if(property.name == newProperty.name) {
				found = true;
			}
		});
		if(!found) {
			properties.push(newProperty);
		}
	};
	this.tick = function() {
		resources.forEach(function(resource){
			resource.tick(properties);
		});
		properties.forEach(function(property){
			var outcomes = property.tick();
			for(var i in outcomes) {
				var outcome = outcomes[i];
				if(outcome.type == "action") {
					availableActions.push(outcome.object);
				} else if(outcome.type == "resource") {
					me.addResource(outcome.object);
				} else if(outcome.type == "upgrade") {
					property.upgrade();
				}
			}
		});
	};
	var cleanContainer = function(container) {
		while(!!container && container.firstChild) {
			container.removeChild(container.firstChild);
		}
	}
	this.report = function(propertiesRoot, resourcesRoot, decisionsRoot) {
		//TODO: report function should not redraw every element on screen
		var formatter = new ValueFormatter();
		cleanContainer(resourcesRoot);
		cleanContainer(propertiesRoot);
		cleanContainer(decisionsRoot);
		resources.forEach(function(resource){
			var el = _("div", function(item){
				item.className = "item";
				item.appendChild(_("div", function(name){
					name.className = "name";
					name.innerHTML = resource.name;
				}));
				item.appendChild(_("div", function(value){
					value.className = "value";
					value.innerHTML = formatter.format(resource.count());
				}));
			});
			resourcesRoot.appendChild(el);
		});
		properties.forEach(function(property){
			var el = _("div", function(item){
				item.className = "item";
				item.appendChild(_("div", function(name){
					name.className = "name";
					name.innerHTML = property.name;
				}));
				item.appendChild(_("div", function(value){
					value.className = "value";
					value.innerHTML = property.value();
				}));
			});
			propertiesRoot.appendChild(el);
		});
		availableActions.forEach(function(action){
			var el = _("div", function(item){
				item.className = "item";
				item.appendChild(_("div", function(name){
					name.className = "name";
					name.innerHTML = action.name;
				}));
				action.actions.forEach(function(actualAction) {
					item.appendChild(_("div", function(button){
						button.className = "button action";
						button.innerHTML = actualAction.name;
						button.onclick = function() {
							var removedActions = availableActions.splice(availableActions.indexOf(action), 1);
							var removedAction = removedActions[0];
							if(removedAction) {
								var outcome = actualAction.action();
								if(outcome.type == "property") {
									if(outcome.change == "add") {
										me.addProperty(outcome.object);
									}
								}
							}
						};
					}));
				});
			});
			decisionsRoot.appendChild(el);
		});
	};
};
window.run = function(){
	var progressBar = $(".progressbar");
	var description = $(".description");
	var propertiesRoot = $(".properties");
	var resourcesRoot = $(".resources");
	var decisionsRoot = $(".decisions");
	var progress = 0;
	var minProgress = 0;
	var maxProgress = 100;
	var tickRate = 15;
	var descriptions = ["Dummy progress..", "Inspecting banks..", "Collecting taxes..", "Daydreaming..", "Arguing on TV..", "Laughing at people..", "Inventing lies.."];
	var r = function(array) {
		var i = (Math.random() * array.length);
		return array[Math.floor(i)];
	};

	var system = new PoliticalSystem();

	var testResource = new Resource({
		name: "Gold",
		increment: 0.0001
	});
	system.addResource(testResource);
	system.addProperty(testProperty);

	var perform = function() {
		description.innerHTML = r(descriptions);
		system.tick();
		//TODO: move to incProgress and rewrite the report function
		system.report(propertiesRoot, resourcesRoot, decisionsRoot);
	};
	var incProgress = function(){
		progress++;
		if(progress > maxProgress) {
			progress = minProgress;
			perform();
		}
	};
	var setProgress = function(){
		progressBar.style.width = progress + "%";
	};
	var tick = function() {
		incProgress();
		setProgress();
		setTimeout(tick, tickRate);
	};
	system.report(propertiesRoot, resourcesRoot, decisionsRoot);
	tick();
}
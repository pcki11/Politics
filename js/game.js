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
	this.tick = function() {
		resources.forEach(function(resource){
			resource.tick(properties);
		});
		properties.forEach(function(property){
			var outcome = property.tick();
			if(outcome.type == "action") {
				availableActions.push(outcome.object);
			} else if(outcome.type == "resource") {
				me.addResource(outcome.object);
			}
		});
	};
	this.report = function(propertiesRoot, resourcesRoot, decisionsRoot) {
		var formatter = new ValueFormatter();
		while(resourcesRoot.firstChild) {
			resourcesRoot.removeChild(resourcesRoot.firstChild);
		}
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
				}))
			});
			resourcesRoot.appendChild(el);
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
	var tickRate = 200;
	var descriptions = ["Dummy progress..", "Inspecting banks..", "Collecting taxes..", "Daydreaming..", "Arguing on TV..", "Laughing at people..", "Inventing lies.."];
	var r = function(array) {
		var i = (Math.random() * array.length);
		return array[Math.floor(i)];
	};

	var system = new PoliticalSystem();

	var testResource = new Resource({
		name: "Gold",
		increment: 1e60
	});
	system.addResource(testResource);

	var performActions = function() {
		description.innerHTML = r(descriptions);
		system.tick();
		system.report(propertiesRoot, resourcesRoot, decisionsRoot);
	};
	var incProgress = function(){
		progress++;
		if(progress > maxProgress) {
			progress = minProgress;
			performActions();
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
	tick();
}
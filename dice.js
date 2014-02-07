
var dice = 2;
var sides = 6;
var weight_factor = 2;

var initials = new Array();
var history = new Array();
var current_probs = new Array();

var show_probs = false;
var roll_valid = false;

function show_weightfactor() {
	$("#weightfactor_input").show();
	$("#weightfactor_input").val(weight_factor.toFixed(1));
	$("#weightfactor").hide();
}

function hide_weightfactor() {
	weight_factor = +$("#weightfactor_input").val();

	if (weight_factor < 1)
		weight_factor = 1;

	$("#weightfactor_input").hide();
	$("#weightfactor").html("" + weight_factor.toFixed(1));
	$("#weightfactor").show();
}

function calc_total_prob() {
	// Count up all our probabilities.
	// We can't just do Math.pow(dice, sides) since some probabilities may be < 0
	var total_prob = 0;
	for (var i = 0; i < current_probs.length; i++) {
		if (current_probs[i] > 0)
			total_prob += current_probs[i];
	}

	return total_prob;
}

function setup_probs() {
	var results = "<tr>";

	var total_prob = calc_total_prob();

	// Use the middle probability (which is the highest) as a scaling value
	// to prevent the dot stacks from getting too high.
	var scale = 1;
	var middle_prob_index = Math.round(initials.length/2);
	var middle_prob = initials[middle_prob_index];
	if (middle_prob > 10)
		scale = 10 / middle_prob;

	for (var i = 0; i < initials.length; i++) {
		if (initials[i] <= 0)
			continue;

		var prob = current_probs[i] * scale;

		if (prob < 0)
			prob = 0;

		results = results + "<td class='prob' valign='bottom'><div class='pips' style='height:" + (prob * 16) + "px'></div>";
		results = results + "<div class='prob_roll'>" + i + "<br /><em class='prob_probability'>" + Math.round(prob*100/total_prob) + "%</em><br /><span class='history'>" + history[i] + "</span></div></td>";
	}

	results = results + "</tr>";

	$("#probs").html(results);
}

function roll() {
	if (!roll_valid)
		return;

	var total_prob = calc_total_prob();

	var random = Math.random() * total_prob;
	var roll = 0;

	// Figure out which roll this random number is associated with.
	for (var i = 0; i < current_probs.length; i++) {
		if (current_probs[i] <= 0)
			continue;

		if (random < current_probs[i]) {
			roll = i;
			break;
		}

		random -= current_probs[i];
	}

	// Count up initial probabilities not including this roll.
	var total_initials = 0;
	for (var i = 0; i < initials.length; i++) {
		if (i != roll)
			total_initials += initials[i];
	}

	history[roll]++;

	// This roll is now less likely to occur.
	current_probs[roll] -= weight_factor;

	// Distribute that probability out to the others according to the initial distribution.
	for (var i = 0; i < current_probs.length; i++) {
		if (initials[i] > 0 && i != roll)
			current_probs[i] += initials[i] * weight_factor / total_initials;
	}

	$("#roll_result").html(roll);
	$("#roll_result").hide();
	$("#roll_result").fadeIn();

	if (show_probs)
		setup_probs();

	return roll;
}

function toggle_probabilities()
{
	show_probs = !show_probs;

	if (show_probs) {
		$("#show_probs").html("Hide probabilities");
		setup_probs();
	} else {
		$("#show_probs").html("Show probabilities");
		$("#probs").html("");
	}
}

// This function counts how likely each result is for an arbitrary number of die with an arbitrary number of sides.
// I think there's a formula for doing this in constant time in each result, but meh.
function accumulate_combination(current_total, number, current_die) {
	if (current_die == dice) {
		initials[+current_total + +number]++;
		return;
	}

	for (var i = 1; i < sides + 1; i++)
		accumulate_combination(current_total + number, i, current_die + 1)
}

function initialize(event) {
	dice = +$("#dice").val();
	sides = +$("#sides").val();

	if (dice < 1) {
		roll_valid = false;
		$("#errormsg").html("Not enough dice.");
		$("#errormsg").fadeIn();
		return;
	} else if (sides < 2) {
		roll_valid = false;
		$("#errormsg").html("Not enough sides.");
		$("#errormsg").fadeIn();
		return;
	} else if (dice > 4) {
		roll_valid = false;
		$("#errormsg").html("Too many dice.");
		$("#errormsg").fadeIn();
		return;
	} else if (sides > 20) {
		roll_valid = false;
		$("#errormsg").html("Too many sides.");
		$("#errormsg").fadeIn();
		return;
	} else {
		roll_valid = true;
		$("#errormsg").fadeOut();
	}

	initials = new Array();

	for (var i = 0; i <= sides * dice; i++)
		initials[i] = history[i] = 0;

	// Calculate the probability of each die roll (each initial is over sides^dice to get the probability.)
	for (var i = 1; i < sides + 1; i++)
		accumulate_combination(0, i, 1);

	// Make a copy of the initials array to be our current probabilities array.
	current_probs = initials.slice(0);

	weight_factor = 3;
	if (dice*sides > 12)
		weight_factor = dice*sides * 3 / 12;
	else
		weight_factor = ((dice*sides)-4) * (2/8) + 1; // Remaps [4, 12] to [1, 3]

	$("#weightfactor").html("" + weight_factor.toFixed(1));
	$("#roll_result").html("");

	if (show_probs)
		setup_probs();

	/*test_probs = new Array();
	for (var i = 0; i <= sides * dice; i++)
		test_probs[i] = 0;
	for (var i = 0; i < 10000; i++)
		test_probs[roll()]++;

	console.log(test_probs);*/
}

$( document ).ready(function() {
	$("#roll").on("click", roll);
	$("#dice").focusout(initialize);
	$("#sides").focusout(initialize);
	$("#reset").on("click", initialize);
	$("#show_probs").on("click", toggle_probabilities);
	$("#weightfactor").on("click", show_weightfactor);
	$("#weightfactor_label").on("click", show_weightfactor);
	$("#weightfactor_input").focusout(hide_weightfactor);

	$(document).keypress(function(e) {
		if(e.which == 13 || e.which == 32) // enter or space
			roll();
	});
	initialize();
});

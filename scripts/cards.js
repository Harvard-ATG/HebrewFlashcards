log("Testing Site");
initJQuery(false);


/****** Global Variables for Flashcards **********************************/ //{
		// var baseURL = 'http://www.fas.harvard.edu/~atgproject/flashcards/';
		var baseURL = '/~atgproject/flashcards/';
		var filename = ''; // current page file name
		var foldername = ''; // current page's directory name
		getLocation();

		var isHebrew = undefined; // whether or not current page is for Hebrew classes
		checkHebrew();

		var mediaFields = new Array();
		getMediaFields();

		var xmlDoc = undefined; //xml Document open
		var title = ''; // set page title
		var primary = '';
		var secondary = '';
		var info = '';  // which field to show
        var hidden = ''; // which field to hide
		var cardFields = new Array(); // the structure of the cards
		var colorSupport = true;
		getPrototype();

		var results = new Array();

		document.getElementsByTagName("head")[0].innerHTML += '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />';
		var pagetitle = title;
		if (filename == "admin.cgi"){
			pagetitle = "Admin: " + title;
		}
		document.getElementsByTagName("head")[0].innerHTML += "<title>"+pagetitle+"</title>";
		document.write('<div id="header"><h1>'+pagetitle+'</h1></div>');

		var xmlFiles = new Array(); // array of xml filenames
		var words = 0; //number of words in set of flashcards
        var word = 1;  // current word number
		var weekFile = '';  // filename of current set
		var weekName = '';  // display name of current set

	function loadScript(url)
	{
		var script     = document.createElement('script');
		script.src = url;

		var head = document.getElementsByTagName('head')[0],
		done = false;
		script.onload = script.onreadystatechange = function() {
			if (!done && (!this.readyState || this.readyState == 'loaded' || this.readyState == 'complete')) {
				done = true;
			};
		};
		head.appendChild(script);
	}

	function initJQuery(jQueryScriptOutputted)
	{
	    if (typeof(jQuery) == 'undefined')
	    {
	        if (!jQueryScriptOutputted)
	        {
				loadScript("https://code.jquery.com/jquery-1.9.1.js");
				loadScript("https://code.jquery.com/ui/1.10.3/jquery-ui.js");
	        }
	        setTimeout("initJQuery(true)", 50);
	    }
	    else
	    {
	    	$(readyFunction);
	    }
}

//}
/****** Setup ************************************************************/ //{
	//initializes the flashcards
    function initialize(){
		getLocation();
		getPrototype();
		//getXMLFileNames();

		var table = '<center><table id="card"></table><div id="changeCardInterface"></div></center>';
		document.getElementById("flashcards").innerHTML = table + document.getElementById("flashcards").innerHTML;

		// Display radio button that selects field to hide
		selectWeek();
		selectHidden();
		enterSearch();

		// Set current week number
		if (document.getElementById("selectweek")){
		  weekFile = document.getElementById("selectweek").value;
		  weekName = getWeekName(weekFile);
		}
		// *****TODO*******: Fix Bug with selectHidden() when the website is first opened
	}

	//Get xml filenames from mapfile and display dropdown list of weeks
	function getXMLFileNames(){
		xmlFiles = new Array();
		xmlDoc = openXMLPrecise("xml/map.xml");
		var itemnum = xmlDoc.getElementsByTagName("xml").length;
		for (var i = 0; i < itemnum; i++)
			xmlFiles.push(xmlDoc.getElementsByTagName("xml")[i].childNodes[0].nodeValue);
	}

	// Get card prototype
	function getPrototype(){
		xmlDoc = openXMLPrecise("xml/prototype.xml");
		title = xmlDoc.getElementsByTagName("title")[0].childNodes[0].nodeValue;
		primary = xmlDoc.getElementsByTagName("primary")[0].childNodes[0].nodeValue;
		secondary = xmlDoc.getElementsByTagName("secondary")[0].childNodes[0].nodeValue;
		info = primary;
		hidden = secondary;
		cardFields = new Array();
		var itemnum = xmlDoc.getElementsByTagName("field").length;
		for (var i = 0; i < itemnum; i++){
			var field = xmlDoc.getElementsByTagName("field")[i].childNodes[0].nodeValue;
			if (isMedia(field, "color"))
				colorSupport = true;
			cardFields.push(field);
		}
	}

	function getMediaFields(){
		mediaFields = new Array();
		var master = openXMLPrecise("../scripts/master.xml");
		var itemnum = master.getElementsByTagName("media").length;
		for (var i = 0; i < itemnum; i++)
			mediaFields.push(master.getElementsByTagName("media")[i].childNodes[0].nodeValue);
	}
//}
/****** Flashcard Interface **********************************************/ //{
	// diplays word info on flashcards; returns # of rows in interface
	function displayWordInfo(){
		var cardColor = getField("color");
		if (cardColor == "")
			cardColor = "#FFFFFF";
		else if (cardColor.toUpperCase() == "PINK")
			cardColor = "FFCCFF"
		else if (cardColor.toUpperCase() == "BLUE")
			cardColor = "00FFFF"
		// Display title of set of flashcards
		insertrow(0, '<div class="mainCardRow"><i><u>' + weekName + "</u></i></div>", cardColor);
		// Dispalys nonhidden field, button to reveal hidden field,
		// button to play audio file, and buttons to navigate through cards
		var currentrow = 1;
		for (var i in cardFields)
			currentrow = displayField(cardFields[i], currentrow, cardColor);
		return currentrow;
	}

	// refreshes/updates flashcards with new info, settings, or changes
	function refresh(){
		for (var i = document.getElementById("card").rows.length - 1; i >=0; i--)
			deleterow(i);
		var numrows = displayWordInfo();
		if (word <= words)
			displayChangeCardInterface(numrows);
	}
//}
/****** Retrieve Data from XML *******************************************/ //{
	// open xml file relative to parent directory
	function openXML(xml){
		return openXMLPrecise("../" + xml);
	}

	function openXMLPrecise(xml){
	  // code for IE7+, Firefox, Chrome, Opera, Safari
	  if (window.XMLHttpRequest)
		xmlhttp=new XMLHttpRequest();
	  // code for IE6, IE5
	  else
		xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
	  // adds random ending to force browswer to reload xml
	  xmlhttp.open("GET",xml + "?nocache=" + new Date().getTime(),false);
	  xmlhttp.send();
	  return xmlhttp.responseXML;
	}

	// Checks whether a field has a value
	function getField(field, wordnum){
		var value = $.trim(getWordInfo(field, wordnum));
		if (value.match(/\S/gi) == null)
			return "";
		return value;
	}

	// gets word info from xml document
	function getWordInfo(info, wordnum){
	  if(wordnum === undefined)
	  	wordnum = word;
	  if (wordnum <= words){
		  if (xmlDoc.getElementsByTagName("word")[wordnum-1].getElementsByTagName(info).length > 0){
			if (xmlDoc.getElementsByTagName("word")[wordnum-1].getElementsByTagName(info)[0].childNodes.length > 0)
			  return xmlDoc.getElementsByTagName("word")[wordnum-1].getElementsByTagName(info)[0].childNodes[0].nodeValue;
		  }
	  }
	  return "";
	}
//}
/****** Word Interface ***************************************************/ //{
	// transitions between words in flashcard set
	function jumpToWord(wordnum){
	  if (wordnum === undefined)
		word = Math.ceil(Math.random() * words);
	  else if (wordnum <= 0)
		word = words;
	  else if (wordnum > words)
		word = 1;
	  else
		word = wordnum;
	  refresh();
	  if (document.getElementById("wordedit")){
		wordEditTable();
		recheckForms();
	  }
	}
//}
/****** Week Interface ***************************************************/ //{
	// dropdown for select flashcard set
	function selectWeek(id) {
	  if (id === undefined)
		id = "flashcards";
	  var dropdown = '<label><b>Cards:</b></label><select id="selectweek" onchange="setWeek(this.value)"><option value=""></option>';
	  if (!isHebrew){
		getXMLFileNames();
		dropdown += '<optgroup label=\"' + foldername +'\">' + foldername;
		for (var i in xmlFiles) {
			var filepath = getCurDirFilePath(xmlFiles[i]);
			var name = xmlFiles[i].slice(0, xmlFiles[i].indexOf('.'));
			dropdown += '<option value=\"' + filepath +'\">' + name + "</option>";
		}
		dropdown += "</optgroup>";
		//openXMLPrecise("../scripts/mastermap.xml");
	  }
	  else {
		xmlDoc = openXMLPrecise("../scripts/mastermap.xml");
		var set = xmlDoc.getElementsByTagName(foldername)[0]
		var items = set.getElementsByTagName("xml");
		if (items){
			dropdown += '<optgroup label=\"' + set.nodeName +'\">' + set.nodeName;
			for (var i = 0; i < items.length; i++){
				var fname = items[i].childNodes[0].nodeValue;
				var name = fname.slice(0, f.indexOf('.'));
				dropdown += '<option value=\"' + set.nodeName +"/xml/" + fname +'\">' + name + "</option>";
			}
			dropdown += "</optgroup>";
		}
		if (filename != "admin.cgi"){
		  var root = xmlDoc.getElementsByTagName("mastermap")[0];
		  var sets = root.childNodes;
		  for (var j = 0; j < sets.length; j++){
			set = sets[j];
			if (set.nodeName == "#text" || set.nodeName == foldername)
				continue;
			var items = set.getElementsByTagName("xml");
			if (items){
				dropdown += '<optgroup label=\"' + set.nodeName +'\">' + set.nodeName;
				for (var i = 0; i < items.length; i++){
					var fname = items[i].childNodes[0].nodeValue;
					var name = fname.slice(0, fname.indexOf('.'));
					dropdown += '<option value=\"' + set.nodeName +"/xml/" + fname +'\">' + name + "</option>";
				}
				dropdown += "</optgroup>";
			}
		  }
	    }
	  }
	  document.getElementById(id).innerHTML += dropdown + '</select><br />';
	}

	// sets flashcard set, opens xml document, and reinitializes globals
	function setWeek(i) {
	  if (i != ""){
		weekFile = i;
		weekName = getWeekName(i);
		word = 1;
		xmlDoc = openXML(i);
		words = 0;
		if (xmlDoc){
			words = xmlDoc.getElementsByTagName("word").length;
		}
		else
			alert("Sorry! This xml file is invalid or nonexistant.");
		refresh();
		if (document.getElementById("wordedit")){
			wordEditTable();
			wordTable();
			recheckForms()
		}
	  }
	}

	// takes in a file path ('test/xml/Week1.xml')
	// and returns name ('test: Week1')
	function getWeekName(weekFile){
		return weekFile.replace("/xml/", ": ").replace(".xml", "");
	}

	// take in a local file name ('Week1.xml') and returns file path
	// of file in current directory ('test/xml/Week1.xml');
	function getCurDirFilePath(localfile){
		return foldername + '/xml/' + localfile;
	}
//}
/****** Hidden Interface *************************************************/ //{
	// radio button for selecting which field to hide
	function selectHidden(id){
	  if (id === undefined)
		id = "flashcards";
	  var radio = '<label><b>Hide:</b></label><input type="radio" name="hiddeninfo" value="' + info + '"' +
		'onchange="setHidden(this.value)" class="bigButton">'+info.toUpperCase()+'</input>' +
		'<input type="radio" name="hiddeninfo" value="'+hidden+'" checked="checked"' +
		'onchange="setHidden(this.value)" class="bigButton">'+hidden.toUpperCase()+'</input><br />';
		document.getElementById(id).innerHTML += radio;
	}

	// sets hidden field
	function setHidden(hiddeninfo){
	  if (hidden != hiddeninfo)
		info = hidden;
	  hidden = hiddeninfo;
	  if (weekFile != undefined)
		refresh();
	}
//}
/****** Search ***********************************************************/ //{
	function enterSearch(id){
		if (id === undefined)
			id = "flashcards";
		var input = '<button type="button" onclick="executeSearch()">Search</button>';
		input += '<input name="searchText" type="text" id="searchText" onchange="executeSearch(this.value)" placeholder="Enter text here to search" /><br /><div id="searchResults"></div>';
		document.getElementById(id).innerHTML += input;
	}

	function executeSearch(){
		document.getElementById("searchResults").innerHTML = "";
		var text = document.getElementById("searchText").value;
		if (text == "")
			return false;
		var query = new RegExp(text,"gi");
		var counter = 0;
		var select = "";
		results = new Array();
		for (var f = 0; f < cardFields.length; f++){
			var field = cardFields[f];
			if (!isMedia(field)){
				var initial = counter;
				select += '<optgroup label="' + field + '" >';
				for (var w = 0; w < xmlFiles.length; w++){
					var weekname = xmlFiles[w]
					var xml = openXMLPrecise("xml/" + weekname);
					var elements = xml.getElementsByTagName("word");
					for (var wordnum = 0; wordnum < elements.length; wordnum++){
						if (elements[wordnum].getElementsByTagName(field).length > 0){
							if (elements[wordnum].getElementsByTagName(field)[0].childNodes.length > 0){
								var value = elements[wordnum].getElementsByTagName(field)[0].childNodes[0].nodeValue;
								if (value.match(query)){
									var result = new searchResult(weekname, wordnum, field, value);
									results.push(result);
									counter++;
									select += '<option value="' + (results.length - 1) + '" >' + result.toString() + '</option>';
								}
							}
						}
					}
				}
				//if (initial == counter)
				//	select += '<option value="">No Results</option>';
				select += '</optgroup>';
			}
		}
		select = '<select onchange="openResult(this.value)"><option value="">' + counter + ' RESULTS FOUND!</option>'+ select + "</select>";
	    document.getElementById("searchResults").innerHTML = select;
	}



	function searchResult(weekname, wordnum, field, value){
		this.weekfile = getCurDirFilePath(weekname);
		this.wordnum = wordnum + 1;
		this.field = field;
		this.value = value;
		this.toString = toString;
	}

	function toString(){
		return getWeekName(this.weekfile) + ", Word #"+ this.wordnum + ", " + this.field + ": " + this.value;
	}

	function openResult(i){
		if (i == "")
			return false;
		setWeek(results[i].weekfile);
		jumpToWord(results[i].wordnum);
	}
//}
/****** Card Table Rows **************************************************/	//{
	    // Displays a row in table based on the field and its value
		function displayField(field, row, color, showHidden){
			var value = strip(getField(field));
			if (value == "" || isMedia(field, "color") || isMedia(field, "answer"))
				return row;
			else if (field == hidden && showHidden != true)
			{
				var rowHTML = '<div class="hiddenFieldRow"><input type="text" id="guess" value="" placeholder="Enter the answer here" onchange="guessCheck('+row+');"/>';
				rowHTML += hidden.toUpperCase() + ': <button onclick="guessCheck('+row+');">Guess</button>';
				rowHTML += '<button onclick="choose('+row+');">Choose</button><button onclick="show('+row+');">Reveal</button></div>';
				insertrow(row, rowHTML, color);
			}
			else if (isMedia(field))
				insertrow(row, mediaHTML(field, getAbsoluteURL(value)), color);
			else if (field == info || field == hidden)
				insertrow(row, '<div class="mainCardRow">' + value + "</div>", color);
			else
				insertrow(row, value, color);
			return row + 1;
		}

		// add field to flashcard
        function insertrow(row, text, color){
			if (!colorSupport)
				color = "#FFFFFF";
			var r = document.getElementById("card").insertRow(row);
			r.innerHTML = '<td style="background-color: ' + color + '" >' + text + "</td>";
		}

        // remove field from flashcard, usually to be updated
        function deleterow(row) {
          document.getElementById("card").deleteRow(row);
        }

		// reveals hidden field
        function show(row){
			deleterow(row);
			var cardColor = getField("color");
			if (cardColor == "")
				cardColor = "#FFFFFF";
			else if (cardColor.toUpperCase() == "PINK")
				cardColor = "FFCCFF"
			else if (cardColor.toUpperCase() == "BLUE")
				cardColor = "00FFFF";
			displayField(hidden, row, cardColor, true);
        }
        function guessCheck(row){
        	var input = $("#card tr:eq("+row+") input").length;
        	if (!input)
        	{
        		var html = '<input type="text" id="guess" value="" placeholder="Enter the answer here" onchange=“guessCheck('+row+');"/>';
        		$("#card tr:eq("+row+") select").replaceWith(html);
        		return;
        	}

        	var answer = $("#card tr:eq("+row+") input").val().trim();
        	if (answer.toLowerCase() == getGuess(hidden).toLowerCase())
        	{
        		$("#card tr:eq("+row+") input").css({"background-color":"#aaffaa"});
        		$("#card tr:eq("+row+") input").css({"border-color":"green"});
           		$("#card tr:eq("+row+") input").effect("shake", {"direction":"up", "times":4, "distance":5}, 1000, function(){
           			$(".quickdisplay").remove();
           		});
           		$("#card tr:eq("+row+") input").after('<span style="color:green" class="quickdisplay">&#10004;</span>');
           	}
           	else
           	{
           		$("#card tr:eq("+row+") input").css({"background-color":"#ffaaaa"});
           		$("#card tr:eq("+row+") input").css({"border-color":"red"});
           		$("#card tr:eq("+row+") input").effect("shake", {"direction":"left", "times":4, "distance":5}, 1000, function(){
           			$(".quickdisplay").remove();
           		});
           		$("#card tr:eq("+row+") input").after('<span style="color:red" class="quickdisplay">&#10006;</span>');
           	}
        }
        function guess(row){
		var rowHTML = '<select onchange="guessed('+row+', this.value)"><option value=""></option>';
        	if (words < 5)
        	{
        		for (var i = 0; i < words; i++)
        			rowHTML += '<option value="'+getGuess(hidden, i) +'">'+getGuess(hidden, i)+'</option>';
        	}
        	else
        	{
	        	var cardsArray = [];
	        	var correctIndex = Math.round(Math.random() * 4);
	        	for (var i = 0; i < 5; i++)
	        	{
	        		var value = getGuess(hidden);  // current answer if correct index
	        		var cardnumber = word;
	        		if (i != correctIndex)
	        		{
	        			do
	        			{
	        				cardnumber = Math.round(Math.random() * (words-1)) + 1;
	        			}
	        			while (cardsArray[String(cardnumber)] || cardnumber == word);
	        			value = getGuess(hidden, cardnumber);
	        		}
	   				cardsArray[String(cardnumber)] = value;
	       			rowHTML += '<option value="'+value +'">'+value+'</option>';
	        	}
	        }

        	rowHTML += '</select>';
        	var select = $("#card tr:eq("+row+") select").length;
        	if (select)
        		$("#card tr:eq("+row+") select").replaceWith(rowHTML);
        	else
        		$("#card tr:eq("+row+") input").replaceWith(rowHTML);
        }
        function guessed(row, selected)
        {
			if (selected.toLowerCase() == getGuess(hidden).toLowerCase())
        	{
        		$("#card tr:eq("+row+") select").css({"background-color":"#aaffaa"});
        		$("#card tr:eq("+row+") select").css({"border-color":"green"});
           		$("#card tr:eq("+row+") select").effect("shake", {"direction":"up", "times":4, "distance":5}, 1000, function(){
           			$(".quickdisplay").remove();
           		});
           		$("#card tr:eq("+row+") select").after('<span style="color:green" class="quickdisplay">&#10004;</span>');
           	}
           	else
           	{
           		$("#card tr:eq("+row+") select").css({"background-color":"#ffaaaa"});
           		$("#card tr:eq("+row+") select").css({"border-color":"red"});
           		$("#card tr:eq("+row+") select").effect("shake", {"direction":"left", "times":4, "distance":5}, 1000, function(){
           			$(".quickdisplay").remove();
           		});
           		$("#card tr:eq("+row+") select").after('<span style="color:red" class="quickdisplay">&#10006;</span>');
           	}
        }


        function choose(row)
        {
        	var rowHTML = '<select onchange="chose('+row+', this.value)"><option value=""></option>';
        	if (words < 5)
        	{
        		for (var i = 0; i < words; i++)
        			rowHTML += '<option value="'+getAnswer(hidden, i) +'">'+ getAnswer(hidden, i)+'</option>';
        	}
        	else
        	{
	        	var cardsArray = [];
	        	var correctIndex = Math.round(Math.random() * 4);
	        	for (var i = 0; i < 5; i++)
	        	{
	        		var value = getAnswer(hidden);  // current answer if correct index
	        		var cardnumber = word;
	        		if (i != correctIndex)
	        		{
	        			do
	        			{
	        				cardnumber = Math.round(Math.random() * (words-1)) + 1;
	        			}
	        			while (cardsArray[String(cardnumber)] || cardnumber == word);
	        			value = getAnswer(hidden, cardnumber);
	        		}
	   				cardsArray[String(cardnumber)] = value;
	       			rowHTML += '<option value="'+value +'">'+value+'</option>';
	        	}
	        }

        	rowHTML += '</select>';
        	var select = $("#card tr:eq("+row+") select").length;
        	if (select)
        		$("#card tr:eq("+row+") select").replaceWith(rowHTML);
        	else
        		$("#card tr:eq("+row+") input").replaceWith(rowHTML);
        }

        function chose(row, selected)
        {
        	if (selected.toLowerCase() == getAnswer(hidden).toLowerCase())
        	{
        		$("#card tr:eq("+row+") select").css({"background-color":"#aaffaa"});
        		$("#card tr:eq("+row+") select").css({"border-color":"green"});
           		$("#card tr:eq("+row+") select").effect("shake", {"direction":"up", "times":4, "distance":5}, 1000, function(){
           			$(".quickdisplay").remove();
           		});
           		$("#card tr:eq("+row+") select").after('<span style="color:green" class="quickdisplay">&#10004;</span>');
           	}
           	else
           	{
           		$("#card tr:eq("+row+") select").css({"background-color":"#ffaaaa"});
           		$("#card tr:eq("+row+") select").css({"border-color":"red"});
           		$("#card tr:eq("+row+") select").effect("shake", {"direction":"left", "times":4, "distance":5}, 1000, function(){
           			$(".quickdisplay").remove();
           		});
           		$("#card tr:eq("+row+") select").after('<span style="color:red" class="quickdisplay">&#10006;</span>');
           	}
        }

    	function getGuess(field, wordnum)
    	{
    		for (var i in cardFields){

				if ((cardFields[i] == "answer"+field) || (cardFields[i] == "answer-"+field))
				{
					var answerField = getField(cardFields[i], wordnum);
					if (answerField)
					{
						return answerField;
					}
				}
				else if (cardFields[i] == "answer")
				{
					var answerField = getField(cardFields[i], wordnum);
					if (answerField)
					{
						return answerField;
					}
				}

			}
			return getField(field, wordnum);
    	}

		// displays interfaces for switching between cards
		function displayChangeCardInterface(row){
			var changeCardInterface = 'Word #<input size="2" maxlength="3" type="text" value='+
				word + ' onchange="jumpToWord(Number(this.value));" />/' + words +
				'<br /><button onclick="jumpToWord(1);">l\<\<</button><button onclick="jumpToWord(word-1);">\<\<</button>' +
				'<button onclick="jumpToWord();">Random</button>' +
				'<button onclick="jumpToWord(word+1);">\>\></button><button onclick="jumpToWord(words);">\>\>l</button>';
			document.getElementById("changeCardInterface").innerHTML = changeCardInterface;
		}
//}
	function getAnswer(field, wordnum)
    	{
    		for (var i in cardFields){
				if (cardFields[i] == "answer")
				{
					var answerField = getField(cardFields[i], wordnum);
					if (answerField)
						return answerField
				}
			}
			return getField(field, wordnum);
    	}

/****** Media ****************************************************/ //{
		function mediaHTML(field, url){
			switch(isMedia(field)){
				case "audio":
					return mediaLabel(field) + audioHTML(url);
				case "image":
					return mediaLabel(field) + imageHTML(url);
				case "video":
					return mediaLabel(field) + videoHTML(url);
				case "color":
					return "";
				case "answer":
					return "";
			}
		}

		function mediaLabel(fieldname){
			if (fieldname.length == 5)
				return "";
			else if (fieldname[5] == "-")
				return fieldname.slice(6) + ': ';
			else
				return fieldname.slice(5) + ': ';
		}

		// plays audiofile if one exist for words
		function audioHTML(audio, autoplay){
			if (autoplay === undefined)
				autoplay = "false";
			var type = getMIMEType(audio);

			// this is HTML5 Audio added September 22, 2017
		    return '<audio controls>' +
                   	'<source src="' + audio + '" type="audio/mp3">' +
                   	'<p>Your browser doesn\'t support HTML5 audio. Here is a <a href="' + audio + '">link to the audio</a> instead.</p>' +
                   	'</audio>';

	            // everything beyond this point in the method is really old and depricated
			var platform = getplatform();
			switch(platform){
				case "android":
					return '<a href="'+audio+'" target="audioiframe">Play Audio</a><br />';
				case "iOS":
					width = "80";
					height = "50";
					return '<object width="'+width+'" height="'+height+'>' +
						'<param name="autostart" value="'+autoplay+'">' +
						'<param name="autoplay" value="'+autoplay+'">' +
						'<param name="src" value='+audio+'>' +
						'<param name="controller" value="true">' +
						'<embed src='+audio+' controller="true" width="'+width+'" height="'+height+'" autoplay="'+autoplay+'" autostart="'+autoplay+'" type="'+type+'">' +
					'</object>';
				default:
					width = "50";
					height = "15";
					return '<object width="'+width+'" height="'+height+'>' +
						'<param name="autostart" value="'+autoplay+'">' +
						'<param name="autoplay" value="'+autoplay+'">' +
						'<param name="src" value='+audio+'>' +
						'<param name="controller" value="true">' +
						'<embed src='+audio+' controller="true" width="'+width+'" height="'+height+'" autoplay="'+autoplay+'" autostart="'+autoplay+'" type="'+type+'">' +
					'</object>';
			}
			return '<div style="font-size:20px;">No Audio File</div>';
		}

		function imageHTML(url){
			var platform = getplatform();
			var width = '';
			var height = '';
			switch(platform){
				case "android":
					width = "350px";
					height = "350px";
				case "iOS":
					width = "350px";
					height = "350px";
				default:
					width = "10px";
					height = "10px";
			}
			return '<img src="' + url +'" alt="Image not found!" />';
		}

		function videoHTML(url){
			var platform = getplatform();
			switch(platform){
				case "android":
					if (!url.match(/youtube.com/gi))
						return '<a href="' + url +'" target="videoiframe">Play Video</a>'
					return '<iframe class="video" src="https://www.youtube.com/embed/'+ getParameterByName("v", url) +'?rel=0" frameborder="0" allowfullscreen>url</iframe>';
				case "iOS":
					//return '<iframe class="video" src="http://www.youtube.com/embed/'+ getParameterByName("v", url) +'?rel=0" frameborder="0" allowfullscreen>url</iframe>';
					return '<a href="' + url +'" target="videoiframe">Play Video</a>';
				default:
					if (!url.match(/youtube.com/gi))
						return '<video class="video" controls="controls" src="' + url + '"></video>';
					return '<iframe class="video" src="https://www.youtube.com/embed/'+ getParameterByName("v", url) +'?rel=0" frameborder="0" allowfullscreen>url</iframe>';
			}
		}

		function getAbsoluteURL(url){
			if (url.substr(0,4) == "www.")
				url = "https://" + url;
			else if (url.slice(0,7).toLowerCase() != "https://")
				url = baseURL + url;
			return url;
		}

		function isMedia(field, media){
			if (media != undefined){
				var identifier = field.slice(0,media.length).toLowerCase();
				if (identifier == media)
					return media;
			}
			else {
				for (var i in mediaFields){
					if (isMedia(field, mediaFields[i]))
						return mediaFields[i];
				}
			}
			return false;
		}

		function getMIMEType(url){
			if (url.match(/.mp3$/))
				return "audio/mpeg";
			else if (url.match(/.wav$/))
				return "audio/x-wav";
			else if (url.match(/.ogg$/))
				return "audio/ogg";
			else if (url.match(/(.mid$|.rmi$)/))
				return "audio/mid";
			else if (url.match(/.m3u$/))
				return "audio/x-mpegurl";
			else if (url.match(/.aif/))
				return "audio/x-aiff";
			else if (url.match(/.ra/))
				return "audio/x-pn-realaudio";
			return "audio/basic";
		}
//}
/****** Admin - General **************************************************/ //{
	// Displays all of the xmlFiles used for Flashcards, based on mapfile
	function drawTable(){
		// Main Table
		document.write('<table border="1" id="main"><tr><th>Files</th><th>Manage</th><th>Preview</th><th>Words</th></tr>' +
			'<tr><td class="cell"><div id="files"><p class="slide" id="slideXMLFiles">Browse XML</p><div id="xml" class="panel"></div>' +
			'<p id="slideAudio" class="slide">Browse Audio</p><div class="panel" id="audio"></div></div></td>' +
			'<td class="cell"><div id="manage"><div id="wordedit"><p class="slide" id="slideWordEdit">Edit Word:</p><div id="wordEditForm" class="panel"></div></div><div id="prototype" /></div></td>' +
			'<td class="cell"><div id="preview"><p id="slideFlashcard" class="slide">View Desktop Version</p><div id="flashcards" class="panel"></div></td>' +
			'<td class="cell"><div id="words"><p id="slideWordsList" class="slide">Field List:</p><div id="wordsForm" class="panel"></div></div></td></tr></table>');
		initialize();
		xmlTable();
		fileInterface();
		//prototypeTable(); // commented out 8/2/22 after review
		audioTable();
		setWeek(getCurDirFilePath(xmlFiles[0]));
		//setWeek(xmlFiles[0].slice(0, xmlFiles[0].indexOf('.')));
	}

	// Rechecks the xmlFile and word in the two tables
	function recheckForms(){
		for (var i = 0; i < xmlFiles.length; i++) {
            var name = getCurDirFilePath(xmlFiles[i]);
			if (name == weekFile){
				document.forms["deleteFileForm"].elements[i].checked = true;
				document.getElementById("xmlFileList").rows[i].style.backgroundColor = "#66FF00";
				//break;
			}
			else
				document.getElementById("xmlFileList").rows[i].style.backgroundColor = "#7FFFD4";
		}
		document.forms["deleteWordForm"].elements[word-1].checked = true;
		for (var i = 0; i < words; i++){
			if (i == word - 1)
				document.getElementById("cardList").rows[word-1].style.backgroundColor = "#66FF00";
			else
				document.getElementById("cardList").rows[i].style.backgroundColor = "#7FFFD4";
		}
	}

	// retrieces the checkvalue for a form with radio buttons
	function getRadioValue(form, radioname){
		var radioFiles = document.forms[form].elements[radioname];
		for (var i in radioFiles){
			if (radioFiles[i].checked)
				return radioFiles[i].value;
		}
	}

	// retrieces the checkvalue for a form with radio buttons
	function getCheckedValues(form, checkboxname){
		var checkboxes = document.forms[form].elements[checkboxname];
		var checked = new Array();
		for (var i in checkboxes){
			if (checkboxes[i].checked)
				checked.push(checkboxes[i].value);
		}
		return checked;
	}
//}
/****** Admin - XML Table ************************************************/ //{
	// Displaces the list of xml file names
	function xmlTable(){
		getXMLFileNames();
		var table = '<div id="xmltable"><form method="POST" id="deleteFileForm"><table border="1" id="xmlFileList">';
		for (var i = 0; i < xmlFiles.length; i++) {
            //var name = xmlFiles[i].slice(0, xmlFiles[i].indexOf('.'));
			var name = getCurDirFilePath(xmlFiles[i]);
			table += "<tr><td><a href=\"xml/" + xmlFiles[i] + '" target="_blank">' + xmlFiles[i] + '</a></td><td>';
			table += '<input type="radio" name="deleteFile" onchange="setWeek(this.value)" value="' + name + '" /></td></tr>';
		}
		table += '</table></form></div><div id="fileinterface"></div>';
		document.getElementById("xml").innerHTML = table;
	}

	function fileInterface(){
		var fileinterface = 'Selected File: <button type="button" onclick="downloadXML()">Download</button>';
		fileinterface += '<button type="button" onclick="confirmDeleteXML()">Delete</button>';
		fileinterface += '<button type="button" onclick="newXMLFile()">Create New XML File</button>';
		fileinterface += '<button onclick="slideUploadXML()" id="showUploadXML">Upload XML File</button>';
		fileinterface += '<form method="post" enctype="multipart/form-data" id="uploadFileForm">';
		fileinterface += '<input type="file" name="file" id="file" />'
		fileinterface += '<button type="button" onclick="confirmReplaceXML()">Upload</button></form>';
		document.getElementById("fileinterface").innerHTML = fileinterface;
	}

	function newXMLFile(){
		var newfile = prompt("New XML File Name: ", ".xml");
		if (newfile != "" && newfile != ".xml"){
			if (newfile.slice(-4) != ".xml"){
				alert('"' + newfile + '" is not valid. Filename must end with ".xml" to be an xml file.');
				return false;
			}
			for (var i = 0; i < xmlFiles.length; i++){
				if (xmlFiles[i] == newfile){
					alert('A file by the name of "' + newfile +'" already exists.  There cannot be duplicate files.')
					return false;
				}
			}
			document.write('<form method="post" id="newFileForm"><input type="hidden" name="newFile" value="' + newfile+ '" /></form>')
			document.forms["newFileForm"].submit();
		}
	}

	function downloadXML(){
		var checkedvalue = getRadioValue("deleteFileForm", "deleteFile");
		window.open("download.cgi?file=../" + checkedvalue, "_self");
	}

	// Confirms deletion of an xml file
	function confirmDeleteXML(){
		var checkedvalue = getRadioValue("deleteFileForm", "deleteFile");
		var confirmation = confirm("Delete File: " + checkedvalue + "?");
		if (confirmation){
			document.forms["deleteFileForm"].submit();
		}
	}

	// Confirms that uploading file might replace existing file
	function confirmReplaceXML(){
		var confirmation = confirm("If a file already exists with the same name as this uploaded file, it will be replaced. Continue?");
		if (confirmation){
			document.forms["uploadFileForm"].submit();
		}
	}
//}
/****** Admin - Manage (Word Edit) ***************************************/ //{
	// Displays the word editing table
	function wordEditTable(){
		var table = 'Edit Word:<input type="text" readonly="readonly" value="' + weekName + ' - Word #' + word + '" />';
		document.getElementById("slideWordEdit").innerHTML = table;
		table = '<form method="post" name="wordUpdateForm"><table border="1"><tr><th class="subhead">Field</th><th class="subhead">Value</th></tr>';
		// table += '<tr><td><b>' + cardFields[0] + '</b></td><td><b>' + getWordInfo(cardFields[0]) + '</b></td></tr>';
		if (word <= words){
			for (var i = 0; i < cardFields.length; i++){
				fieldvalue = getWordInfo(cardFields[i]).replace(/"/g,'&quot;');
				table += '<tr><td>';
				var media = isMedia(cardFields[i]);
				if (cardFields[i] == primary || cardFields[i] == secondary)
					table += '<b>'+cardFields[i]+'</b> ';
				else if (media)
				{
					table += "<i>"+ cardFields[i].slice(0,media.length) + "</i>"+cardFields[i].slice(media.length);
				}
				else
					table += cardFields[i] + '</td>'
				table += '<td><input type="text" name="' + cardFields[i] + '" value="' + fieldvalue + '" /></td></tr>';
			}
		}
		else{
			table += "<tr><td>No Word #" + word + "</td></tr>";
		}

		table += '</table><input type="hidden" name="wordUpdate" value="true" /><input type="hidden" name="updateweek" value="' +
		weekFile +'" /><input type="hidden" name="updateword" value="' + word +'" /><input type="submit" value="Update" /></form>';
		document.getElementById("wordEditForm").innerHTML = table;
	}
//}
/****** Admin - Manage (Prototype) ***************************************/ //{
	function prototypeTable(){
		var table = '<p id="slidePrototype" class="slide">Modify Prototype</p>';
		table += '<div class="panel" id="prototypeTable"><form method="post" id="deleteFieldForm"><table border="1"><tr><th>Position</th><th>Field</th></tr>';
		for (var i = 0; i < cardFields.length; i++){
			table += '<tr>';
			table += '<td>';
			if (i != 0)
				table += '<button name="up" type="button" onclick="moveFieldDown(' + (i-1) + ')">&uarr;</button>';
			if (i != cardFields.length -1)
				table += '<button name="down" type="button" onclick="moveFieldDown(' + i + ')">&darr;</button>'
			table += '</td><td>';
			var media = isMedia(cardFields[i]);
			if (cardFields[i] == primary)
				table += '<b>primary:</b> ';
			else if (cardFields[i] == secondary)
				table += '<b>secondary:</b> ';
			if (media){
				table += "<i>"+ cardFields[i].slice(0,media.length) + "</i>"+cardFields[i].slice(media.length);
			}
			else
				table += cardFields[i];
			table += '</td><td><input type="radio" name="deleteField" value="' + i + '" /></td>';
		}
		table += '</form></table>';
		table += '<button type="button" onclick="addField()">Add New Field</button>';
		table += '<button type="button" onclick="confirmDeleteField()">Delete Selected Field</button><br />';
		table += '<button type="button" onclick="setPrimary()">Set as Primary Field</button>';
		table += '<button type="button" onclick="setSecondary()">Set as Secondary Field</button></div>';
		document.getElementById("prototype").innerHTML = table;
	}

	function moveFieldDown(fieldnumber){
		document.write('<form method="post" name="moveFieldDownForm"><input type="hidden" name="fieldDown" value="' + fieldnumber + '" /></form>')
		document.forms["moveFieldDownForm"].submit()
	}

	function addField(){
		var newfield = prompt("New field: ");
		if (newfield.match(/\s/g)){
			alert('Field name can not contain spaces. "' + newfield +'" is not a valid field name.');
			return false;
		}
		//var newfield = strip(document.getElementById("addField").value);
		if (newfield != ""){
			for (var i = 0; i < cardFields.length; i++){
				if (cardFields[i] == newfield){
					alert('"' + newfield +'" already exist in this prototype.  There cannot be duplicate fields.');
					return false;
				}
			}
			document.write('<form method="post" id="newFieldForm"><input type="hidden" name="addField" value="' + newfield + '" /></form>')
			document.forms["newFieldForm"].submit();
		}
	}

	function setSpecialField(specialfield){
		//*****TODO***** disallow setting audio, video, etc as primary or secondary field
		var text = '';
		var form = '<form method="post" id="setSpecialFieldsForm">';
		var checkedvalue = getRadioValue("deleteFieldForm", "deleteField");
		if (isMedia(cardFields[checkedvalue], "color")){
			alert('You cannot set "color" as special field because it is not shown in card interface.  It only sets the background color of the card.')
			return false;
		}
		else if (isMedia(cardFields[checkedvalue], "answer")){
			alert('You cannot set "answer" as special field because it is hidden in card interface.  It only sets answer for text input for a field.')
			return false;
		}
		if (specialfield == "primary"){
			var otherfield = "secondary";
			if 	(cardFields[checkedvalue] == primary){
				alert('"' + cardFields[checkedvalue] +'" is already set as the primary field.  ');
				return true;
			}
			else if (cardFields[checkedvalue] == secondary){
				text = '"' + cardFields[checkedvalue] +'" is currently set as the '+otherfield+' field.  ';
				text += 'Swap it with current '+specialfield+' field, and set "' + primary +'" as '+otherfield+' field?';
				if (confirm(text))
					form += '<input type="hidden" name="setSecondary" value="' + primary + '" />';
				else
					return false;
			}
			form += '<input type="hidden" name="setPrimary" value="' + cardFields[checkedvalue] + '" />';
		}
		else if (specialfield == "secondary"){
			var otherfield = "primary";
			if (cardFields[checkedvalue] == secondary){
				alert('"' + cardFields[checkedvalue] +'" is already set as the secondary field.  ');
				return true;
			}
			else if	(cardFields[checkedvalue] == primary){
				text = '"' + cardFields[checkedvalue] +'" is currently set as the '+otherfield+' field.  ';
				text += 'Swap it with current '+specialfield+' field, and set "' + secondary +'" as '+otherfield+' field?';
				if (confirm(text))
					form += '<input type="hidden" name="setPrimary" value="' + secondary + '" />';
				else
					return false;
			}
			form += '<input type="hidden" name="setSecondary" value="' + cardFields[checkedvalue] + '" />';
		}
		form += '</form>';
		document.write(form);
		document.forms["setSpecialFieldsForm"].submit();
	}

	function setPrimary(){
		setSpecialField("primary");
	}
	function setSecondary(){
		setSpecialField("secondary");
	}

	function confirmDeleteField(){
		var checkedvalue = getRadioValue("deleteFieldForm", "deleteField");
		if (checkedvalue == undefined)
			return false;
		else if (cardFields[checkedvalue] == primary){
			var text = '"'+cardFields[checkedvalue]+'" is currently set as the primary field.  ';
			text += 'You must set another field as the primary field before you can delete this one';
			alert(text);
			return false;
		}
		else if (cardFields[checkedvalue] == secondary){
			var text = '"'+cardFields[checkedvalue]+'" is currently set as the secondary field.  ';
			text += 'You must set another field as the secondary field before you can delete this one';
			alert(text);
			return false;
		}
		var confirmation = confirm("Deleting a field will make field unrecognized and unusualable for all flashcards. Are you sure that you want to delete this field: \"" + cardFields[checkedvalue] + "\"?  ");
		if (confirmation){
			if (confirm('DELETE FIELD: "' + cardFields[checkedvalue] +'"?'))
				document.forms["deleteFieldForm"].submit();
		}
	}
//}
/****** Admin - Preview **************************************************/ //{
	function audioTable(){
		var table = '<table border="0"><tr><td><div id="audioInterface"></div></td></tr><tr><td><div id="audioPlayer"></div></td></tr></table>';
		document.getElementById("audio").innerHTML = table;
	}

	function checkMP3(file){
		if (file.match(/.mp3$/)){
			var player = audioHTML(file, "true") + '<br />';
			player += '<select id="addAudioField"><option value="">SELECT FIELD</option>'
			for (var i = 0; i < cardFields.length; i++){
				if (isMedia(cardFields[i], "audio")){
					player += '<option value="' + cardFields[i]+ '" >' + cardFields[i]+'</option>';
				}
			}
			player += '</select><button onclick="checkAddAudioLink(\''+file+'\')">Add Link to Current Word</button>';
			document.getElementById("audioPlayer").innerHTML = player;
		}
		else{
			var form = '<form method="post" name="audioFile">';
			form += '<input type="hidden" name="checkAudio" value="' + file + '" />';
			form += '<input type="hidden" name="week" value="' + weekFile + '" />';
			form += '<input type="hidden" name="word" value="' + word + '" />';
			form += '</form>'
			document.write(form)
			document.forms["audioFile"].submit()
		}
	}

	function checkAddAudioLink(link){
		var field = document.getElementById("addAudioField").value;
		link = link.replace("../", "").replace("./","");
		if (field == "")
			return false;
		if (getField(field) != ""){
			var txt = 'The current word already has link "' + getField(field) +'" for field "' + field+'".';
			txt += '  Would you like to replace it with "' + link + '"?';
			if (!confirm(txt))
				return false;
		}
		document.forms["wordUpdateForm"].elements[field].value = link;
		document.forms["wordUpdateForm"].submit();
	}

	function newAudioFolder(){
		var current = document.getElementById("currentFolder").value.replace(/\/$/,"")+ '/';
		var currentPretty = current.replace(/^[.][.]\//,"").replace(/^[.]\//,"");
		var newfolder = prompt('Create a new folder at the following location: "' + currentPretty + '"', '');
		if (newfolder == undefined || newfolder == "")
			return false;
		var form = '<form method="post" name="newAudioFolderForm">';
		form += '<input type="hidden" name="newAudioFolder" value="' + current + newfolder + '" />';
		form += '<input type="hidden" name="week" value="' + weekFile + '" />';
		form += '<input type="hidden" name="word" value="' + word + '" />';
		form += '</form>';
		document.write(form);
		document.forms["newAudioFolderForm"].submit()
	}

		// Confirms that uploading file might replace existing file
	function confirmReplaceAudio(){
		var confirmation = confirm("If a file already exists with the same name as this uploaded file, it will be replaced. Continue?");
		if (confirmation){
			document.forms["uploadAudioForm"].submit();
		}
	}
//}
/****** Admin - Words ****************************************************/ //{
	// displays the word list table
	function wordTable(multipleDelete){
		slideWords();
		var listField = selectFieldList();
		var table = '<div id="wordtable"><form method="POST" id="deleteWordForm"><table id="cardList">';
		if (words > 0){
			for (var i = 1; i <= words; i++){
				word = i;
				table += '<tr><td>' + i + '</td><td>' + getWordInfo(listField) + '</td><td><input type="radio" name="deleteWord" value="' + i + '" onchange="jumpToWord(' + i + ')" /></td>';
				if (multipleDelete == 1)
					table += '<td><input type="checkbox" name="deleteMultipleWords" value="' +i+'" /></td>';
				table += '</tr>';
			}
		}
		word = 1;
		table += '<input type="hidden" name="updateWeek" value='+ weekFile +' /></table></form></div><div id="wordinterface"></div>';
		document.getElementById("wordsForm").innerHTML = table;
		wordInterfaceHTML(multipleDelete);
	}

	function selectFieldList(){
		if (document.getElementById("selectCardList")){
			return document.getElementById("selectCardList").value;
		}
		var select = '<select onchange="wordTable()" id="selectCardList">';
		for (var i = 0; i < cardFields.length; i++){
			if (cardFields[i] == primary)
				select += '<option value="' + cardFields[i] + '" selected="selected">'+ cardFields[i] +'</option>';
			else if (!isMedia(cardFields[i])){
				select += '<option value="' + cardFields[i] + '">'+ cardFields[i] +'</option>';
			}
		}
		select += "</select>";
		document.getElementById("slideWordsList").innerHTML += select;
		return primary;
	}

	// Adds a word to the current word list
	function addWord(){
		var form = '<form method="post" name="addWordForm">';
		form += '<input type="hidden" name="addWordToWeek" value="' + weekFile + '" />';
		form += '</form>'
		document.write(form)
		document.forms["addWordForm"].submit();
	}

	// Confirms deletion of an word
	function confirmDeleteWord(){
		var checkedvalue = getRadioValue("deleteWordForm", "deleteWord");
		if (checkedvalue > words)
			return;
		var confirmation = confirm("Delete Word: " + checkedvalue +" ?");
		if (confirmation){
			document.forms["deleteWordForm"].submit();
		}
	}

	function wordInterfaceHTML(multipleDelete){
		var wordinterface = '<button type="button" onclick="addWord()">Add New Word</button>'
		wordinterface += '<button type="button" onclick="confirmDeleteWord()">Delete Current Word</button>';
		if (multipleDelete == 1)
			wordinterface += '<button type="button" onclick="confirmDeleteMulipleWords()">Delete Checked Word(s)</button>';
		else
			wordinterface += '<button type="button" onclick="wordTable(1)">Select Multiple Words to Delete</button>';
		document.getElementById("wordinterface").innerHTML = wordinterface;
	}

	function confirmDeleteMulipleWords(){
		var checkedvalues = getCheckedValues("deleteWordForm", "deleteMultipleWords");
		var txtarray = "";
		if (checkedvalues.length == 0)
			return false;
		for (var i =0; i < checkedvalues.length; i++){
			txtarray += checkedvalues[i];
			if (i < checkedvalues.length - 1)
				txtarray += ", ";
		}
		var confirmation = confirm("Are you sure that you want to delete " + checkedvalues.length +" words? Word #" + txtarray + ' will be deleted?');
		if (confirmation){
			if (confirm(checkedvalues.length + ' WORDS WILL BE DELETED! THIS CANNOT BE UNDONE! PROCEED?')){
				var form = '<form method="post" name="deleteMultipeWordsForm">';
				form += '<input type="hidden" name="deleteMultipleWords" value="' + txtarray + '" />';
				form += '<input type="hidden" name="updateWeek" value="' + weekFile + '" />';
				form += '</form>'
				document.write(form)
				document.forms["deleteMultipeWordsForm"].submit();
			}
		}
		return false;
	}
//}
/****** jQuery functions *************************************************/ //{
	function readyFunction(){
		$("#slideAudio").click(function(){
			if ($("#audio").css("display") == "block"){
				$("#audio").slideToggle("slow", function(){
					$("#xml").css("max-height","85%");
					$("#xmltable").css("max-height","75%");
				});
			}
			else{
				$("#xml").css("max-height","65%")
				$("#xmltable").css("max-height","50%");
				$("#audio").slideToggle("slow");
			}
		});

		$("#slidePrototype").click(function(){
			if ($("#prototypeTable").css("display") == "block"){
				$("#prototypeTable").slideToggle("slow", function(){
					$("#wordedit").css("max-height","80%");
					$("#wordEditForm").css("max-height","80%");
				});
			}
			else{
				$("#wordedit").css("max-height","50%");
				$("#wordEditForm").css("max-height","40%");
				$("#prototypeTable").slideToggle("slow");
			}
		});

		$("#slideFlashcard").click(function(){
			$("#flashcards").slideToggle("slow");
		});

		$("#slideWordsList").click(function(){
			if (event.target.nodeName.toLowerCase() == "p")
				$("#wordsForm").slideToggle("slow");
		});

		$("#slideXMLFiles").click(function(){
			$("#xml").slideToggle("slow");
		});

		$("#slideWordEdit").click(function(){
			$("#wordEditForm").slideToggle("slow");
		});
	}

	function slideAudio(){
		//default is non slide
		$(document).ready(function(){
			$("#xml").css("max-height","65%")
			$("#xmltable").css("max-height","75%");
			$("#audio").show();
		});
	}

	function slidePrototype(){
		$(document).ready(function(){
			$("#wordedit").css("max-height","50%")
			$("#prototypeTable").show();
		});
	}

	function slideWords(){
		$(document).ready(function(){
			$("#wordsForm").show();
		});
	}

	function slideUploadXML(){
		$(document).ready(function(){
			$("#showUploadXML").hide();
			$("#uploadFileForm").slideDown();
		});
	}

	function slideUploadAudio(){
		$(document).ready(function(){
			$("#showUploadAudio").hide();
			$("#uploadAudioForm").slideDown();
		});
	}

	//if (getplatform() == "android")
//}
/****** Miscellaneous/Defunct ********************************************/ //{
		// Checks whether this is a mobile device
        function checkmobile(){
            alert(navigator.platform);
            var desktops = ["Win32","Win64","Linux i686","Linux x86_64","MacPPC","MacIntel","SunOS","HP-UX", "X11"];
            var mobile_desk = ["BlackBerry",,"Pike v7.6 release 92"];
            var mobile_nondesk = ["Linux armv7l", "iPod", "iPhone", "IPod", "Ipod"];
            for (platform in mobile_nondesk){
                if (navigator.platform == mobile_nondesk[platform])
                    return true;
            }
            return false;
        }

		// Gets returns the platform of the device
		function getplatform(){
			switch(navigator.platform){
				case "Linux armv7l":
					return "android";
				case "iPod":
					return "iOS";
				case "iPhone":
					return "iOS";
				default:
					return "desktop";
			}
		}

		// Strips whitespace from the beginning and the end of text
		function strip(str){
			var len = str.length;
			if (len == 0)
				return '';
			var start = 0;
			var end = len-1;
			while (str[start].match(/\s/))
				start++;
			while (str[end].match(/\s/))
				end--;
			return str.slice(start, end+1);
		}

		function getLocation(){
			var loc = location.pathname.match(/\/\w*\/\w*[.]\w*/);
			if (loc){
				filename = loc[0].match(/\w*[.]\w*$/)[0]; // current page
				foldername = loc[0].replace("/" + filename, "").replace(/\//g,"");
			}
			else{
				filename = "index.html";
				foldername = location.pathname.match(/\/\w*\/$/)[0].replace(/\//g,"");
			}
		}

		function checkHebrew(){
			isHebrew = true;
			if (foldername.length < 5)
				isHebrew = false;
			else if (foldername.slice(0,5).toUpperCase() != "HEBREW")
				isHebrew = false;
		}

		function getParameterByName(name, path){
		  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
		  var regexS = "[\\?&]" + name + "=([^&#]*)";
		  var regex = new RegExp(regexS);
		  var results = regex.exec(window.location.href);
		  if (path != undefined)
			results = regex.exec(path);
		  if(results == null)
			return "";
		  else
			return decodeURIComponent(results[1].replace(/\+/g, " "));
		}

		// Logs to Chrome Console
	function log()
	{
		var isChrome = /chrome/i.test(navigator.userAgent);
		if (isChrome)
			console.log.apply(console, arguments);
	}
//}

<?php @session_start();

	require_once("../lib/domxml-php4-to-php5.php");
	$CONFIG = require_once("../config/config.php");

	//clearBrowserCache();
	header('Content-Type: text/html; charset=UTF-8');

	// Logout: End Session and reload page
	if($_GET['logout'] == '1'){
		error_log('Logging out...');
		logout();
	}

	// Lookup auth credentials for current directory
	$dirname = strtolower(basename(getcwd()));
	if(isset($CONFIG['auth'][$dirname])) {
		$_SESSION['current'] = $dirname;
	} else {
		error_log("Admin credentials not configured for $dirname");
		print("Admin credentials not configured for $dirname");
		exit();
	}

	// Checks if user is logged in, ask to login
	function login(){
		global $CONFIG;
		if (isset($_POST['password'])){
			$_SESSION['login'] = "false";
			// Ask user to login if no already logged in
			if($_POST['password'] != $CONFIG['auth'][$_SESSION['current']] && $_POST['password'] != $CONFIG['auth']['admin']){
				javascript('alert("Incorrect Password!");');
			}
			else{
				$_SESSION['pword'] = $CONFIG['auth'][$_SESSION['current']];
			}
		}
		if ($_SESSION['pword'] != $CONFIG['auth'][$_SESSION['current']]){
			echo('<form method="post"><label>Password: </label><input type="password" name="password" />' .
					'<button type="submit">Submit</button></form><br /><br /><a href="index.html">Flashcards</a>');
		}
		// User is logged in:
		else if ($_SESSION['pword'] == $CONFIG['auth'][$_SESSION['current']]){
			/**********************************************
			 * SERVER TASKS
			 *********************************************/
			initializePHP();
			// Upload a File
			if(isset($_FILES['file'])){
				uploadFile("file");
			}
			if(isset($_FILES['newAudioFile'])){
				uploadFile("newAudioFile", $_POST["currentFolder"]);
			}

			check("newXMLFile", "newFile"); // Create a New XML File
			check("deleteFile", "deleteFile");	// Delete a File


			check("updateXML", "updateword"); // Update a Word
			check("addWordToWeek", "addWordToWeek");  // Add Word
			check("deleteWord", "deleteWord"); // Delete a Word
			check("deleteMultipleWords", "deleteMultipleWords"); // Deletes multiple words

			checkEditPrototype();
			/***************************************
			 * ACTUALLY WRITING TO PAGE
			 **************************************/
			// Display Table of XML Files and Upload Form
			// **DRAW TABLE AFTER ALL FILE MANIPULATION**
			if ($_SESSION['tableDrawn'] == "false"){
				javascript("drawTable()");
			}

			checkEditAudio();

			echo('
			<div class="footer"><a href="index.html">Flashcards</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="?logout=1">Logout</a></div>');
		}
	}

	function checkEditPrototype(){
		$prototypeEdited = false;
		$prototypeEdited = $prototypeEdited || check("moveFieldDown", "fieldDown"); // Rearrange prototype
		$prototypeEdited = $prototypeEdited || check("addField", "addField");	// Add Field
		$prototypeEdited = $prototypeEdited || check("deleteField", "deleteField"); // Delete Field
		$prototypeEdited = $prototypeEdited || check("setPrimary", "setPrimary"); // Set Primary Field
		$prototypeEdited = $prototypeEdited || check("setSecondary", "setSecondary"); // Set Secondary Field
		if ($prototypeEdited)
			javascript("slidePrototype()");
	}

	function checkEditAudio(){
		$audioEdited = false;
		$audioEdited = $audioEdited || check("newAudioFolder", "newAudioFolder");
		audioFiles();
		$audioEdited = $audioEdited || check("checkAudio", "checkAudio");
		if ($audioEdited)
			javascript('slideAudio()');
	}

/***************************************
 * General Setup
 **************************************/
	function initializePHP(){
		// Acknowledge Current Session and Open Map File
		$_SESSION['map'] = domxml_open_file("xml/map.xml");
		$_SESSION['prototype'] = domxml_open_file("xml/prototype.xml");
		getXMLFileNamesPHP();
		getCardFieldsPHP();
		$_SESSION['tableDrawn'] = "false";
	}

	// Get card fields from prototype
	function getCardFieldsPHP(){
		$fields = $_SESSION['prototype']->get_elements_by_tagName("field");
		$_SESSION['cardFields'] = array();
		for ($i = 0; $i < count($fields); $i++){
			$fieldname = $fields[$i]->get_content();
			array_push($_SESSION['cardFields'], $fieldname);
		}
	}

	//Get xml filenames from mapfile
	function getXMLFileNamesPHP(){
		$files = $_SESSION['map']->get_elements_by_tagName("xml");
		$_SESSION['xmlFiles'] = array();
		for ($i = 0; $i < count($files); $i++){
			$filename = $files[$i]->get_content();
			array_push($_SESSION['xmlFiles'], $filename);
		}
	}

	// checks POST/runs code if set
	function check($func, $postvalue){
		if (isset($_POST[$postvalue])){
			//alert($func);
			$func($_POST[$postvalue]);
			unset($_POST[$postvalue]);
			return true;
		}
		return false;
	}

/***************************************
 * Manage - Word Edit
 **************************************/
	// updates XML of file when word has been changed
	function updateXML($cardnum){
		// retrieve and unset data from form
		$week = $_POST['updateweek'];
		$cardnum = (int)$cardnum;
		unset($_POST['updateweek']);

		// open the corresponding XML file and select the specific card
		$xmlFile = "../" . $week;
		$xml = domxml_open_file($xmlFile);
		$cards = $xml->get_elements_by_tagName("word");
		$card = $cards[$cardnum - 1];
		$numcards = count($cards);
		if ($numcards < $cardnum){
			$newNode = $xml->create_element("word");
			$root = $xml->get_elements_by_tagname('week');
            $root[0]->append_child($newNode);
			$card = $cards[$numcards];
		}

		// update each field of card, if neccessary
		for ($i = 0; $i < count($_SESSION['cardFields']); $i++){
			// Acquire new value for field
			$fieldname = $_SESSION['cardFields'][$i];
			$newValue = $_POST[$fieldname];
			unset($_POST[$fieldname]);
			//alert($newValue);
			//alert(stripslashes($newValue));

			// if the card has an element for the field, delete that field
			if ($card->get_elements_by_tagName($fieldname)){
				$field = $card->get_elements_by_tagName($fieldname);
				$field[0]->unlink_node($field[0]);
			}
			if ($newValue != ""){
				$newNode = $xml->create_element($fieldname);
				$newText = $xml->create_text_node($newValue);
				$newNode->append_child($newText);
                $card->append_child($newNode);
			}
		}
		$xml->dump_file($xmlFile, false, true);
		$f = fopen($xmlFile, "w");
		fwrite($f, prettyXML($xml->dump_mem(true)));
		fclose($f);
		removeslashes($xmlFile);
		javascript("drawTable()");
		javascript('setWeek("' .$week. '")');
		javascript('jumpToWord(' .$cardnum.')');
		$_SESSION['tableDrawn'] = "true";
	}

	function deleteWord($cardnum){
		$week = $_POST['updateWeek'];
		unset($_POST['updateWeek']);
		$cardnum = (int) $cardnum;
		$xmlFile = "../". $week;
		$xml = domxml_open_file($xmlFile);
		$cards = $xml->get_elements_by_tagName("word");
		$card = $cards[$cardnum - 1];
		$card->unlink_node($card);
		$xml->dump_file($xmlFile, false, true);
		javascript("drawTable()");
		javascript('setWeek("' .$week. '")');
		javascript('jumpToWord(' .$cardnum.')');
		$_SESSION['tableDrawn'] = "true";
	}

	function deleteMultipleWords($wordTXTArray){
		$week = $_POST['updateWeek'];
		unset($_POST['updateWeek']);
		$xmlFile = "../". $week;
		$xml = domxml_open_file($xmlFile);
		$cards = $xml->get_elements_by_tagName("word");
		$words = explode(", ", $wordTXTArray);
		for ($i = 0; $i < count($words); $i++){
			$card = $cards[(int)$words[$i] - 1];
			$card->unlink_node($card);
		}
		$xml->dump_file($xmlFile, false, true);
		javascript("drawTable()");
		javascript('setWeek("' .$week. '")');
		$_SESSION['tableDrawn'] = "true";
	}

	function addWordToWeek($week){
		$xmlFile = "../". $week;
		$xml = domxml_open_file($xmlFile);
		$cards = $xml->get_elements_by_tagName("word");
		$numcards = count($cards);
		$newNode = $xml->create_element("word");
		$root = $xml->get_elements_by_tagname('week');
        $root[0]->append_child($newNode);
		$xml->dump_file($xmlFile, false, true);
		javascript("drawTable()");
		javascript('setWeek("' .$week. '")');
		javascript('jumpToWord(' .$numcards.')');
		$_SESSION['tableDrawn'] = "true";
	}

/***************************************
 * Manage - Prototype
 **************************************/
	function moveFieldDown($fieldnumber){
		$fields = $_SESSION['prototype']->get_elements_by_tagName("field");
		$bottomtext = $fields[$fieldnumber]->get_content();
		$topnode = $fields[$fieldnumber]->first_child();
		$topnode->set_content($fields[$fieldnumber+1]->get_content());
		$bottomnode = $fields[$fieldnumber+1]->first_child();
		$bottomnode->set_content($bottomtext);
		$_SESSION['prototype']->dump_file("xml/prototype.xml", false, true);
		getCardFieldsPHP();
	}

	function addField($field){
		foreach($_SESSION['cardFields'] as $cardfield){
			if ($field == $cardfield)
				return false;
		}
		$newNode = $_SESSION['prototype']->create_element("field");
		$newText = $_SESSION['prototype']->create_text_node($field);
		$newNode->append_child($newText);
		$root = $_SESSION['prototype']->get_elements_by_tagname('card');
		$root[0]->append_child($newNode);
		$_SESSION['prototype']->dump_file("xml/prototype.xml", false, true);
		getCardFieldsPHP();
	}

	function deleteField($field){
		if ($field >= count($_SESSION['cardFields']))
			return false;
		$fields = $_SESSION['prototype']->get_elements_by_tagName("field");
		$node = $fields[$field];
		$node->unlink_node($node);
		$_SESSION['prototype']->dump_file("xml/prototype.xml", false, true);
		getCardFieldsPHP();
	}

	function setSpecialField($newValue, $fieldname){
		if ($_SESSION['prototype']->get_elements_by_tagName($fieldname)){
			$field = $_SESSION['prototype']->get_elements_by_tagName($fieldname);
			$field[0]->unlink_node($field[0]);
		}
		$newNode = $_SESSION['prototype']->create_element($fieldname);
		$newText = $_SESSION['prototype']->create_text_node($newValue);
		$newNode->append_child($newText);
		$root = $_SESSION['prototype']->get_elements_by_tagname('card');
		$root[0]->append_child($newNode);
		$_SESSION['prototype']->dump_file("xml/prototype.xml", false, true);
		getCardFieldsPHP();
	}

	function setPrimary($newValue){
		setSpecialField($newValue, "primary");
	}

	function setSecondary($newValue){
		setSpecialField($newValue, "secondary");
	}
/***************************************
 * File manipulation
 **************************************/

	/**
	 * Tests that the path is somewhere inside the
	 * application base directory.
	 *
	 * @param string $path abs or relative path to test
	 * @return bool false if path is not inside app root
	 */
	function isValidAppPath($path) {
		$haystack = realpath($path);
		$needle = APP_BASE_DIR;
		if($needle !== "" && strncmp($haystack, $needle, strlen($needle)) === 0) {
			return true;
		}
		return false;
	}

	/**
	 * Tests that the path is valid for audio files within a
	 * hebrew course folder.
	 *
	 * Should match variations of:
	 * 	  /hebrew/audio
	 * 	  /hebrew/audio/test.mp3
	 * 	  /hebrew/audio/week1/test.mp3
	 * 	  /hebrew/audio/unit1/week1/test.mp3
	 *
	 * @param string $path abs or relative path to test
	 * @return bool false if path is not a valid audio folder
	 */
	function isValidAudioPath($path) {
		$abspath = realpath($path);
		error_log("isValidAudioPath? path: $path abspath: $abspath");
		if(!isValidAppPath($abspath)) {
			return false;
		}
		$relative_path = substr($abspath, strlen(APP_BASE_DIR));
		return (bool) preg_match('/^\/\w+\/audio(?:\/\w+)*(?:\/\w+\.mp3)?$/', $relative_path);
	}

	/**
	 * Tests that the path is valid for xml files within a
	 * hebrew course folder.
	 *
	 * Should match variations of:
	 * 	  /hebrew/xml
	 * 	  /hebrew/xml/prototype.xml
	 *
	 * @param string $path abs or relative path to test
	 * @return bool false if path is not a valid xml folder
	 */
	function isValidXMLPath($path) {
		$abspath = realpath($path);
		error_log("isValidXMLPath? path: $path abspath: $abspath");
		if(!isValidAppPath($abspath)) {
			return false;
		}
		$relative_path = substr($abspath, strlen(APP_BASE_DIR));
		return (bool) preg_match('/^\/\w+\/xml(\/\w+\.xml)?$/', $relative_path);
	}

	/**
	 * Tests that the upload location is valid for the type of file.
	 *
	 * @param string $file_extension file extension without leading dot (e.g. mp3, xml).
	 * @param string $path abs or relative path to test
	 * @return bool false if path is not valid for the file type
	 */
	function isValidUploadLocation($file_extension, $path) {
		switch($file_extension) {
			case "mp3":
				return isValidAudioPath($path);
			case "xml":
				return isValidXMLPath($path);
		}
		return false;
	}

	function newXMLFile($newfile){
		if (!is_file("xml/" . newfile)){
			$newXML = fopen("xml/" . $newfile, "w");
			fwrite($newXML, '<?xml version="1.0" encoding="UTF-8"?>');
			fwrite($newXML, '<week />');
			fclose($newXML);
			$newXML = domxml_open_file("xml/" . $newfile);
			$root = $newXML->add_root("week");
			$newXML->dump_file("xml/" . $newfile, false, true);
			chmod("xml/" . $newfile, 0644);
		}
		foreach ($_SESSION['xmlFiles'] as $file){
			if ($file == $newfile)
				return false;
		}
		$newNode = $_SESSION['map']->create_element("xml");
		$newText = $_SESSION['map']->create_text_node($newfile);
		$newNode->append_child($newText);
		$root = $_SESSION['map']->get_elements_by_tagname('map');
		$root[0]->append_child($newNode);
		$_SESSION['map']->dump_file("xml/map.xml", false, true);

		getXMLFileNamesPHP();
		javascript("drawTable()");
		javascript('setWeek(foldername + "/xml/'.$newfile. '")');
		$_SESSION['tableDrawn'] = "true";
	}

	// Uploads a file, with action of either add or replace
	function uploadFile($file, $location = "xml/"){
		error_log("uploadFile: $location");
		// Alert an errorg if one has occured
		if ($_FILES[$file]["error"] > 0){
			if ($_FILES[$file]["error"] == 1){
				$poidsMax = ini_get('post_max_size');
				alert("Unfortunately this file is too large to upload this way. Max File Size = '" . $poidsMax ."'.  Talk to a system administrator to upload file to server");
				return false;
			}
			javascript('alert("Error: ' . $_FILES[$file]["error"] . '");');
			return false;
		}
		// Upload file
		else{
			$uploaded_file_name = $_FILES[$file]["name"];
			error_log("Uploaded file: ". var_export($_FILES[$file], 1));

			// Check the file name is valid
			if(!preg_match('/^\w+\.(mp3|xml)$/', $uploaded_file_name)) {
				error_log("Error: upload filename invalid: " . $uploaded_file_name);
				javascript('alert("Error: Upload filename invalid.");');
				return false;
			}

			// Check the file upload location is valid for the file extension
			$file_extension = pathinfo($uploaded_file_name, PATHINFO_EXTENSION);
			if(!isValidUploadLocation($file_extension, $location)) {
				error_log("Error: upload file location invalid for $file_extension: " . $location);
				javascript('alert("Error: Upload location invalid for $file_extension.");');
				return false;
			}

			move_uploaded_file($_FILES[$file]["tmp_name"], $location . $uploaded_file_name);

			// If filename is not in mapfile, update mapfile
			if (!in_array($uploaded_file_name, $_SESSION['xmlFiles'], TRUE) && $location == "xml/"){
				array_push($_SESSION['xmlFiles'], $uploaded_file_name);
				$newNode = $_SESSION['map']->create_element("xml");
				$newText = $_SESSION['map']->create_text_node($uploaded_file_name);
				$newNode->append_child($newText);
				$root = $_SESSION['map']->get_elements_by_tagname('map');
                $root[0]->append_child($newNode);
				$_SESSION['map']->dump_file("xml/map.xml", false, true);
			}

			// Give file worldwide reading access
			chmod($location . $uploaded_file_name, 0644);
			javascript('alert("Uploaded: ' . $uploaded_file_name . '\n' . "Type: " . $_FILES[$file]["type"] . '\n' .
				"Size: " . ($_FILES[$file]["size"] / 1024) . " Kb" . '\n' . "Stored in: " . $location. $uploaded_file_name .'");');
		}
		if ($location == "xml/"){
			getXMLFileNamesPHP();
			javascript("drawTable()");
			javascript('setWeek(foldername + "/xml/'.$uploaded_file_name. '")');
			$_SESSION['tableDrawn'] = "true";
		}
		unset($_FILES['file']);
	}

	// Remove the file requested to be deleted
	function deleteFile($filename){
		error_log("deleteFile: $filename");

		// Note: the filename includes the course-specific folder,
		// so we make it relative from the parent folder to resolve correctly:
		//   Hebrew123/xml/Test.xml --> ../Hebrew123/xml/Test.xml
		$abspath = realpath("../".$filename);
		if(!isValidXMLPath($abspath)) {
			error_log("Error: delete file permission denied: $filename ($abspath)");
			alert("Error: delete file permission denied.");
			return false;
		}

		// Remove from mapfile
		$files = $_SESSION['map']->get_elements_by_tagname("xml");
		$localname = basename($filename);
		for ($i = 0; $i < count($files); $i++){
			if($localname == $files[$i]->get_content()){
				$files[$i]->unlink_node();
                javascript('alert("Deleted File: ' . $filename . '")');
			}
		}

		// Resave modified map file and update the array of filenames
		$_SESSION['map']->dump_file("xml/map.xml", false, true);

		// Delete file from server
		$result = unlink($abspath);
		if(!$result) {
			error_log("Error deleting file: $abspath");
		}

		getXMLFileNamesPHP();
	}

	function downloadFile($filename){
		$abspath = realpath($filename);
		if(!isValidXMLPath($abspath)) {
			error_log("Error: download file permission denied: $filename ($abspath)");
			alert("Error: download file permission denied: $filename");
			return false;
		}
		header("content-type: application/xhtml+xml");
		header("content-disposition: attachment;filename=" . basename($abspath));
		echo file_get_contents($abspath);
	}

/***************************************
 * Preview - Audio
 **************************************/
	function audioFiles(){
		if ($_SESSION['current'] != 'test')
			return checkAudio('./audio/', false);
		$audiofolders = findAudioFolders();
		$counter = 0;
		$content = 'Select From All "audio" Folders: <br /><select id="audioSelect" onchange="checkMP3(this.value)"><option></option>';
		foreach ($audiofolders as $folder){
			$content .= '<option value="'.$folder.'">'. preg_replace("/^[.][.]\//", "", $folder) . '</option>';
		}
		$content .= '</select>';
		javascript('document.getElementById("audioInterface").innerHTML = \'' . $content . '\'');
	}

	function checkAudio($path){
		if (isset($_POST['week'])){
			javascript('setWeek("' .$_POST['week'] . '")');
			unset($_POST['week']);
		}
		if (isset($_POST['word'])){
			javascript('jumpToWord(' .$_POST['word'].')');
			unset($_POST['word']);
		}
		if (!strstr($path, "/audio"))
			return false;

		// strip trailing slash since the code below assumes no trailing slash.
		if($path[strlen($path)-1] == "/") {
			$path = substr($path, 0, -1);
		}

		if(is_dir($path) && isValidAudioPath($path)){
			$contents = scan_dir($path);
			$newSelect = 'Current Folder: <br />'.preg_replace("/(^[.][.]|^[.]\/audio)[\/]*/", "", $path . "/");
			$newSelect .= '<select id="audioSelect" onchange="checkMP3(this.value)">';
			$newSelect .= '<option /><option value="'.dirname($path).'">BACK</option>';
			foreach ($contents as $file){
				$location = $path ."/" . $file;
				if(is_dir($location) || pathinfo($location, PATHINFO_EXTENSION) == "mp3"){
					$newSelect .= '<option value="'.$location.'">'. $file . '</option>';
				}
			}
			$newSelect .= '</select>';
			$newSelect .= '<button onclick="newAudioFolder()">Add New Folder Here</button>';
			$newSelect .= '<button onclick="slideUploadAudio()" id="showUploadAudio">Upload Audio File Here</button>';
			$newSelect .= '<form method="post" enctype="multipart/form-data" id="uploadAudioForm">';
			$newSelect .= '<input type="file" name="newAudioFile" id="newAudioFile" />';
			$newSelect .= '<input type="hidden" id="currentFolder" name="currentFolder" value="'.$path.'/" />';
			$newSelect .= '<button type="button" onclick="confirmReplaceAudio()">Upload</button></form>';
			javascript('document.getElementById("audioInterface").innerHTML = \'' . $newSelect . '\'');
		}
	}

	function newAudioFolder($path){
		error_log("newAudioFolder: $path");
		if (file_exists($path)) {
			alert('That path already exists!');
		} else {
			// check proposed folder name before creating it
			if(preg_match('/^(?:\.\/)?audio(?:\/\w+)*$/', $path)) {
				mkdir($path, 0777);
			} else {
				error_log("Invalid audio folder path: $path");
				alert('Invalid audio folder path. Must contain only alphanumeric characters.');
			}
		}
	}

	function findAudioFolders($directory = '..'){
		$folders = array();
		if(!isValidAudioPath($directory)) {
			return $folders;
		}
		if($dirhandler = opendir($directory)) {
            while (($sub = readdir($dirhandler)) !== FALSE) {
				$path = $directory."/".$sub;
                if ($sub == 'audio' && is_dir($path)) {
                    array_push($folders, $path);
					//echo $path;
					//echo "<br />";
                }
				else if(is_dir($path) && $sub != '.' && $sub != '..'){
                    $folders = array_merge($folders, findAudioFolders($path));
                }
            }
            closedir($dirhandler);
        }
        return $folders;
	}

	function scan_dir($dir){
		$contents = array();
		if($dirhandler = opendir($dir)) {
            while (($sub = readdir($dirhandler)) !== FALSE) {
				if($sub != '.' && $sub != '..')
					array_push($contents, $sub);
			}
            closedir($dirhandler);
        }
		return $contents;
	}


/***************************************
 * Miscealaneous/Defunct
 **************************************/
	function logout(){
		unset($_POST['password']);
        unset($_SESSION['pword']);
		session_destroy();
        header("Location: admin.cgi");
	}

	// takes in a file path ('test/xml/Week1.xml')
	// and returns name ('Week1.xml')
	// replaced with built in PHP "basename" function
	function getLocalFileName($weekFile){
		return preg_replace("/.*\//", "", $weekFile);
	}

	// PHP function to write Javascript code
	function javascript($code) {
		echo("<script>" . $code . ";</script>\n");
	}

	function alert($text){
		javascript('alert("' . $text . '")');
	}

	function removeslashes($file){
		$f = fopen($file, "r");
		$length = filesize($file);
		/*if ($length <= 0){
			fclose($f);
			return false;
		}*/
		$content = fread($f, $length);
		fclose($f);
		$position = strpos($content, "\\");
		while ($position){
			if ($position >= $length -1)
				break;
			$p = $position + 1;
			$c = $content[$p];
			if ($c == "'" || $c == "\\" || $c == "\""){
				$content = substr($content, 0, $position) . substr($content, $p);
				$p = $position;
			}
			$position = strpos($content, "\\", $p);
		}
		$f = fopen($file, "w");
		fwrite($f, $content);
		fclose($f);
	}

	function prettyXML($xml) {
		 $i = 0;
		 $xml = preg_replace('/\s{2,}/', " ", $xml);
		 $len = strlen($xml);
		 $expectContent = false;
		 $foundContent = false;
		 $indentLevel = 0;
		 $tab = "  ";
		 $pretty = "";
		 while ($i < $len){
			if ($xml[$i] == "<"){
				// Expecting Content and Not Close Tag: indent more
				if ($expectContent && $xml[$i+1] != "/"){
					$indentLevel++;
				}
				// Not Expecting Content and is Close Tag: indent less
				else if (!$expectContent && $xml[$i+1] == "/")
					$indentLevel--;
				if ($xml[$i+1] != "/" && $i != 0 && $expectContent)
					$pretty .= "\n";
				if (!$foundContent)
					$pretty .= str_repeat($tab, $indentLevel);
				else
					$foundContent = false;
				$tagend = strpos($xml, ">", $i);
				$pretty .= substr($xml, $i, $tagend - $i + 1);

				// End Tag
				if ($xml[$i+1] == "/" || $xml[$tagend - 1] == "/"){
					$pretty .= "\n";
					$expectContent = false;
				}
				else
					$expectContent = true;
				$i = $tagend + 1;
			}
			else if (preg_match('/\s/', $xml[$i])){
				while(preg_match('/\s/', $xml[$i]))
					$i++;
			}
			else{
				while ($xml[$i] != "<"){
					$pretty .= $xml[$i];
					$i++;
				}
				$foundContent = true;
			}
		 }
		 return $pretty;
	}

	function clearBrowserCache() {
		header("Pragma: no-cache");
		header("Cache: no-cache");
		header("Cache-Control: no-cache, must-revalidate");
		header("Expires: Mon, 26 Jul 1997 05:00:00 GMT");
		clearstatcache();
	}
?>

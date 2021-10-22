#!/usr/bin/php
<?php @session_start();
	header('Content-Type: text/html; charset=UTF-8');
	$isdownloadPage = false;
	if ($_SESSION['pword'] == $_SESSION['passwords'][$_SESSION['current']]){
		if (file_exists($_GET["file"]) && pathinfo($_GET["file"], PATHINFO_EXTENSION)){
			header("content-type: application/xhtml+xml");
			header("content-disposition: attachment;filename=" . basename($_GET["file"]));
			echo "\n\n";
			echo file_get_contents($_GET["file"]);
		}
		else
			echo("<script>alert('XML File does not exist at this location')</script>");
	}
	else{
		echo("<script>alert('DONWLOAND NOT ALLOWED!! YOU ARE NOT SIGNED IN!!!')</script>");
	}
?>

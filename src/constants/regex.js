/*
	Regex to match URLs pointing to image files in the most common formats.

	Note: it is unfortunate that we use two separate mechanisms
	to discern when an URL points to an image, but here we are.
	
	`REGEX_IMAGE_URL` here needs to be kept in sync 
	with the `imageMimetypes` set defined in `file-mimetype.js`.
*/
export const REGEX_IMAGE_URL = /\.(jpe?g|png|svg|gif|bmp|webp|avif|tiff?)$/i;

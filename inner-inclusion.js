const main = async ()=> {

	const editor_origin = window.location.origin
	const iframe_origin = window.location.origin
	const do_message = (msg)=> {
		window.parent.postMessage(msg, editor_origin)
	}
	const on_message = (event)=> {
		if (event.origin!==editor_origin) {return}
		const data = event.data
		if (!data.kind) {return}
		if (data.kind==='click') {
			const elements = document.elementsFromPoint(data.pos.x, data.pos.y)
			const element = elements[0]
			if (!element) {return}
			const css_selector = generateCSSSelector(element)
			const xpath = generateXPath(element)
			do_message({kind: 'clicked', css_selector, xpath})
			return
		}
		if (data.kind==='hover') {
			const elements = document.elementsFromPoint(data.pos.x, data.pos.y)
			const element = elements[0]
			if (!element || element===window.document.documentElement) {return}
			// get bounds
			const bounds = element.getBoundingClientRect()
			do_message({kind: 'bounds', bounds})
			return
		}
	}
	window.addEventListener('load', () => {
			do_message({kind: 'ready'})
	})
	window.addEventListener('message', on_message, false)
}

function generateCSSSelector(element) {
	let path = [];
	while (element && element.nodeType === Node.ELEMENT_NODE) {
			let selector = element.tagName.toLowerCase();  // Start with the tag name

			if (element.id) {
					// Append the ID if present
					selector += '#' + element.id;
			}

			// Append all class names
			if (element.className) {
					let classes = element.className.split(/\s+/).filter(Boolean).join('.');
					if (classes.length > 0) {
							selector += '.' + classes;
					}
			}

			// Prepend selector to the path array
			path.unshift(selector);
			
			// Move up to the parent element
			element = element.parentNode;
	}
	
	// Join all parts with ' > ' to form a full CSS selector
	return path.join(' > ');
}


function generateXPath(element) {
    var path = [];
    for (; element && element.nodeType === 1; element = element.parentNode) {
        let segment = element.tagName.toLowerCase();
        
        if (element.id) {
            // Include the ID in the XPath; IDs are supposed to be unique, so we can stop here
            segment += `[@id="${element.id}"]`;
            path.unshift(segment);
            break; // Stop the loop as ID should uniquely identify the element
        }

        // If no ID, use the class names if any, otherwise use position
        if (element.className) {
            const classes = element.className.split(/\s+/).filter(Boolean).join('.');
            segment += `[contains(@class, "${classes}")]`;
        }

        // Count siblings of the same type to determine the index
        let sameTagSiblings = 0;
        let child = element;
        while (child = child.previousElementSibling) {
            if (child.nodeType === 1 && child.tagName === element.tagName) {
                sameTagSiblings++;
            }
        }
        if (sameTagSiblings > 0 || element.nextElementSibling) {
            segment += `[${sameTagSiblings + 1}]`;
        }

        path.unshift(segment);
    }
    return path.length ? '/' + path.join('/') : null;
}

main().catch(console.error)

// something like path for web page

// https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system
// https://web.dev/articles/origin-private-file-system


// https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/webkitdirectory


/*

<input type="file" id="file-picker" name="fileList" webkitdirectory multiple />
<output id="output"></output>

// ---- 

const output = document.getElementById("output");
const filePicker = document.getElementById("file-picker");top_dir

filePicker.addEventListener("change", (event) => {
  const files = event.target.files;

  for (const file of files) {
    output.textContent += `${file.webkitRelativePath}\n`;
  }
});


async function getNewFileHandle() {
  const opts = {
    types: [
      {
        description: "Text file",
        accept: { "text/plain": [".txt"] },
      },
    ],
  };
  return await window.showSaveFilePicker(opts);
}



// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----


const pickerOpts = {
  types: [
    {
      description: "Images",
      accept: {
        "image/*": [".png", ".gif", ".jpeg", ".jpg"],
      },
    },
  ],
  excludeAcceptAllOption: true,
  multiple: false,
};


// create a reference for our file handle
let fileHandle;

async function getFile() {
  // open file picker, destructure the one element returned array
  [fileHandle] = await window.showOpenFilePicker(pickerOpts);

  // run code with our fileHandle
}



//  getAsFileSystemHandle


elem.addEventListener("dragover", (e) => {
  // Prevent navigation.
  e.preventDefault();
});
elem.addEventListener("drop", async (e) => {
  // Prevent navigation.
  e.preventDefault();
  const handlesPromises = [...e.dataTransfer.items]
    // kind will be 'file' for file/directory entries.
    .filter((x) => x.kind === "file")
    .map((x) => x.getAsFileSystemHandle());
  const handles = await Promise.all(handlesPromises);

  // Process all of the items.
  for (const handle of handles) {
    if (handle.kind === "file") {
      // run code for if handle is a file
    } else if (handle.kind === "directory") {
      // run code for is handle is a directory
    }
  }
});





// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----


<p>Drag files and/or directories to the box below!</p>

<div id="dropzone">
  <div id="boxtitle">Drop Files Here</div>
</div>

<h2>Directory tree:</h2>

<ul id="listing"></ul>

// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----


#dropzone {
  text-align: center;
  width: 300px;
  height: 100px;
  margin: 10px;
  padding: 10px;
  border: 4px dashed red;
  border-radius: 10px;
}

#boxtitle {
  display: table-cell;
  vertical-align: middle;
  text-align: center;
  color: black;
  font:
    bold 2em "Arial",
    sans-serif;
  width: 300px;
  height: 100px;
}

body {
  font:
    14px "Arial",
    sans-serif;
}

//  ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

let dropzone = document.getElementById("dropzone");
let listing = document.getElementById("listing");

function scanFiles(item, container) {
  let elem = document.createElement("li");
  elem.textContent = item.name;
  container.appendChild(elem);

  if (item.isDirectory) {
    let directoryReader = item.createReader();
    let directoryContainer = document.createElement("ul");
    container.appendChild(directoryContainer);
    directoryReader.readEntries((entries) => {
      entries.forEach((entry) => {
        scanFiles(entry, directoryContainer);
      });
    });
  }
}

dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
});


dropzone.addEventListener("drop", (event) => {
  let items = event.dataTransfer.items;

  event.preventDefault();
  listing.textContent = "";

  for (const item of items) {
    const entry = item.webkitGetAsEntry();

    if (entry) {
      scanFiles(entry, listing);
    }
  }
});


//  ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----



*/


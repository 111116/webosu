

    var handleDragDrop = function(e) {
        e.stopPropagation();
        e.preventDefault();
        pDragboxHint.innerText = pDragboxHint.loadingHint;
        for (let i=0; i<e.dataTransfer.files.length; ++i) {
            let raw_file = e.dataTransfer.files[i];
            console.log("importing file", raw_file.name);
            if (!raw_file) {
                pDragboxHint.innerText = pDragboxHint.noTransferHint;
                return;
            }
            // check suffix name
            if (raw_file.name.indexOf(".osz") === raw_file.name.length - 4) {
                let fs = new zip.fs.FS();
                fs.filename = raw_file.name;
                localforage.setItem(raw_file.name, raw_file, function(err,val) {
                    if (err) {
                        console.error("Error while saving beatmap", fs.filename);
                    }
                })
                console.log(fs);
                fs.root.importBlob(raw_file,
                    function(){
                        addbeatmap(fs, function(box){
                            pBeatmapList.insertBefore(box, pDragbox);
                            pDragboxHint.innerText = pDragboxHint.defaultHint;
                        })
                    },
                    function(err) {
                        pDragboxHint.innerText = pDragboxHint.nonValidHint;
                    });
            } else {
                pDragboxHint.innerText = pDragboxHint.nonOszHint;
            }
        }
    }
    pDragbox.ondrop = handleDragDrop;

    window.addEventListener('dragover', function(e){(e||event).preventDefault()}, false);
    window.addEventListener('drop', function(e){(e||event).preventDefault()}, false);

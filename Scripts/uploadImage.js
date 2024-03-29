//picId显示照片的Image Name
//files照片路径
//需要上传的接口类型
function upfilechange(picId, files, posttype) {
    var file = files.files['0'];
    //图片方向角 added by lzk  
    var Orientation = null;

    if (file) {
        var rFilter = /^(image\/jpeg|image\/png|image\/bmp)$/i; // 检查图片格式  
        if (!rFilter.test(file.type) && file.type != "") {
            alert("请选择jpeg、png、bmp格式的图片", false);
            return;
        }
        // var URL = URL || webkitURL;  
        //获取照片方向角属性，用户旋转控制  
        EXIF.getData(file, function () {
            // alert(EXIF.pretty(this));  
            EXIF.getAllTags(this);
            //alert(EXIF.getTag(this, 'Orientation'));   
            Orientation = EXIF.getTag(this, 'Orientation');
            //return;  
        });

        var base64 = null;
        var oReader = new FileReader();
        oReader.onload = function (e) {
            var image = new Image();
            image.src = e.target.result;
            image.onload = function () {
                var expectWidth = this.naturalWidth;
                var expectHeight = this.naturalHeight;

                if (this.naturalWidth > this.naturalHeight && this.naturalWidth > 800) {
                    expectWidth = 800;
                    expectHeight = expectWidth * this.naturalHeight / this.naturalWidth;
                } else if (this.naturalHeight > this.naturalWidth && this.naturalHeight > 1200) {
                    expectHeight = 1200;
                    expectWidth = expectHeight * this.naturalWidth / this.naturalHeight;
                }
                var canvas = document.createElement("canvas");
                var ctx = canvas.getContext("2d");
                canvas.width = expectWidth;
                canvas.height = expectHeight;
                ctx.drawImage(this, 0, 0, expectWidth, expectHeight);
                //修复ios  
                if (navigator.userAgent.match(/iphone/i)) {
                    //alert(expectWidth + ',' + expectHeight);  
                    //如果方向角不为1，都需要进行旋转 added by lzk  
                    if (Orientation != "" && Orientation != 1) {
                        //alert('旋转处理');
                        switch (Orientation) {
                            case 6://需要顺时针（向左）90度旋转  
                                rotateImg(this, 'left', canvas);
                                break;
                            case 8://需要逆时针（向右）90度旋转  
                                rotateImg(this, 'right', canvas);
                                break;
                            case 3://需要180度旋转  
                                rotateImg(this, 'right', canvas);//转两次  
                                rotateImg(this, 'right', canvas);
                                break;
                        }
                    }

                    //var mpImg = new MegaPixImage(image);
                    //mpImg.render(canvas, {
                    //    maxWidth: 800,
                    //    maxHeight: 1200,
                    //    quality: 0.8,
                    //    orientation: 8
                    //});

                    base64 = canvas.toDataURL("image/jpeg", 1);
                } else if (navigator.userAgent.match(/Android/i)) {// 修复android  
                    var encoder = new JPEGEncoder();
                    base64 = encoder.encode(ctx.getImageData(0, 0, expectWidth, expectHeight), 100);
                } else {
                    //alert(Orientation);  
                    if (Orientation != "" && Orientation != 1) {
                        //alert('旋转处理');  
                        switch (Orientation) {
                            case 6://需要顺时针（向左）90度旋转  
                                rotateImg(this, 'left', canvas);
                                break;
                            case 8://需要逆时针（向右）90度旋转  
                                rotateImg(this, 'right', canvas);
                                break;
                            case 3://需要180度旋转  
                                rotateImg(this, 'right', canvas);//转两次  
                                rotateImg(this, 'right', canvas);
                                break;
                        }
                    }

                    base64 = canvas.toDataURL("image/jpeg", 1);
                }


                //uploadImage(base64);  

                $("#" + picId).attr("src", base64);

                //判断需要上传的接口
                if (posttype == "facepoint") {
                    getfacepoint(base64);
                } else if (posttype == "faceage") {
                    getfaceage(base64);
                }
            };
        };
        oReader.readAsDataURL(file);
    }
}

//对图片旋转处理 added by lzk  
function rotateImg(img, direction, canvas) {
    //alert(img);  
    //最小与最大旋转方向，图片旋转4次后回到原方向    
    var min_step = 0;
    var max_step = 3;
    //var img = document.getElementById(pid);    
    if (img == null) return;
    //img的高度和宽度不能在img元素隐藏后获取，否则会出错    
    var height = img.height;
    var width = img.width;
    //var step = img.getAttribute('step');    
    var step = 2;
    if (step == null) {
        step = min_step;
    }
    if (direction == 'right') {
        step++;
        //旋转到原位置，即超过最大值    
        step > max_step && (step = min_step);
    } else {
        step--;
        step < min_step && (step = max_step);
    }
    //img.setAttribute('step', step);    
    /*var canvas = document.getElementById('pic_' + pid);   
    if (canvas == null) {   
        img.style.display = 'none';   
        canvas = document.createElement('canvas');   
        canvas.setAttribute('id', 'pic_' + pid);   
        img.parentNode.appendChild(canvas);   
    }  */
    //旋转角度以弧度值为参数    
    var degree = step * 90 * Math.PI / 180;
    var ctx = canvas.getContext('2d');
    switch (step) {
        case 0:
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0);
            break;
        case 1:
            canvas.width = height;
            canvas.height = width;
            ctx.rotate(degree);
            ctx.drawImage(img, 0, -height);
            break;
        case 2:
            canvas.width = width;
            canvas.height = height;
            ctx.rotate(degree);
            ctx.drawImage(img, -width, -height);
            break;
        case 3:
            canvas.width = height;
            canvas.height = width;
            ctx.rotate(degree);
            ctx.drawImage(img, -width, 0);
            break;
    }
}
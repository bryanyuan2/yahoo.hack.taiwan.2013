/*
    Yahoo! Open Hack Day 2013
    name: contentscript.js
*/

(function() {

$(document).ready(function() {

    // setting 
    var total_mail = 20;
    
    var beat_speed = 5000;
    var beat_hit_key = 90;
    var beat_sec = 1000;
    var beat_hit_fadeout_speed = "5";
    
    var drum_radius = 55;
    var drum_fuzzy = 0.2; 
    var drum_color = "#E95020";
    
    // beat_ary
    //var beat_ary = ["images/beat/beat_blue_medium.gif", "images/beat/beat_blue_small.gif", "images/beat/beat_red_large.gif", "images/beat/beat_red_medium.gif", "images/beat/beat_red_small.gif"];
    var beat_ary = ["images/beat/yahoo_smile_yellow_130.png", "images/beat/yahoo_smile_purple_130.png"];

    // audio
    var soundtrack = chrome.extension.getURL("audio/sample.mp3");
    var drum_strong_audio = chrome.extension.getURL("audio/drum/drum_strong.mp3");
    var drum_weak_audio = chrome.extension.getURL("audio/drum/drum_weak.mp3");
    var yahoo_audio = chrome.extension.getURL("audio/drum/yahoo_audio.mp3");
    
    // text
    var mail_subject_text = "我是垃圾郵件標題";
    var hint_text = "您有 n 封郵件，點我開始清除";
    //var mail_subject_ary = ["我是垃圾郵件標題", "我是垃圾郵件標題", "我是垃圾郵件標題", "我是垃圾郵件標題", "我是垃圾郵件標題", "我是垃圾郵件標題", ];
    
    var this_mail_status_ary = Array("您已刪除郵件 ", "您已跳過郵件 ", "您已封存郵件 ");

    // var
    var token_url = "";
    var mail_title_ary = [];
    var mail_cid_ary = [];
    var mail_idate_ary = [];

    var mail_score_ary = [];
    var mail_comment_ary = [];
    var mail_status_ary = [];
    
    //initialize
    var click_counter = 0;
    var beat_counter = 0;
    var score_counter = 0;
    var curr_counter = 0;

    var beat_timer_func;
    var beat_array = new Array();

    var yhack_river = $('<div>').addClass("river");
    var yhack_drum = $('<div>').addClass("drum");
    var yhack_beat_clone = $('<img>').addClass("yhack_beat_clone").attr("src", chrome.extension.getURL("images/smiley/yahoo_smiley_120.png"));
    var yhack_score = $('<div>').addClass("yhack_score").text("0");
    
    var yhack_yahoo_pool = $('<div>').attr("id", "yahoo_pool");
    var yhack_yahoo_logo = $('<div>').addClass("yahoo_logo").addClass("logo_loop");

    yhack_yahoo_pool.append(yhack_yahoo_logo);
    yhack_river.append(yhack_yahoo_pool).append(yhack_drum);
    
    $("body").append(yhack_score);
    $("body").append(yhack_beat_clone);


    $("body").append(yhack_river).hide().fadeIn();
    
    // scoring_mail
    function yhack_unread_mail_func(scoring, text) {
        var yhack_unread_mail_title  = $('<span>').addClass("yhack_unread_mail_title").attr("id", "").text(text);
        $(scoring).append(yhack_unread_mail_title).fadeIn();
    }

    function sleep(time) {
        var a = new Date,c = a.getTime();
        do a = new Date;
        while (a.getTime() - c < time)
    };

    /* ymail mail api */
    var yhack_list_mail_request = {
        "method": "ListFolderThreads" ,
        "params":[{
                "fid":"Inbox",
                "sortKey":"date",
                "sortOrder":"down",
                "start":0,
                "numCInfos":70
            }
        ]
    }

    $("body").keydown(function(event) {
        if ( event.which == beat_hit_key ) {
            
            var drum_strong = new Howl({ urls: [ drum_weak_audio ] }).play();

            $(".drum").css("background", drum_color);
            click_counter = click_counter + 1;
            $(".click_counter").text("").text(click_counter);

            var drum_pos = parseInt($(".drum").position().left) + drum_radius;
            
            try {
                var beat_pos = parseInt($("#beat_box_" + beat_array[0]).position().left) + drum_radius;    
            }
            catch (error) {
                var beat_pos = 0;   
            }
            
            $(".drum").removeClass("drum_beat_hint");

            var overlap_val = beat_overlap(drum_pos, beat_pos, drum_radius, drum_fuzzy);

            // hint
            if ( overlap_val != "MISS" && overlap_val != "YET") {

                var curr_beat = beat_array[0];

                $(".drum").addClass("drum_beat_hint");
                $("#beat_" + curr_beat).animate({"width": "200%", "height": "200%", "opacity": "0"}, beat_hit_fadeout_speed);


                $(".yhack_beat_clone").clone().attr("id", "clone_" + curr_beat).appendTo("body");
                $("#clone_" + curr_beat).animate({"top": "50%", "left": "110%"}, 1000);

                //
                score_counter = score_counter + Math.round(overlap_val*1000);
                //console.log(score_counter);

                mail_score_ary[beat_array[0]] = Math.round(overlap_val*1000);
                mail_status_ary[beat_array[0]] = "deleted";

                if (overlap_val > 0 && overlap_val < 0.5) {
                    beat_comment_text("good");
                    mail_comment_ary[beat_array[0]] = "good";
                }
                else if (overlap_val >=0.5 && overlap_val < 1) {
                    beat_comment_text("perfect");
                    mail_comment_ary[beat_array[0]] = "perfect";
                }
                else if (overlap_val > 1) {
                    beat_comment_text("spam");
                    mail_comment_ary[beat_array[0]] = "perfect";
                }

                $(".yhack_score").text("").text(score_counter);

                $(".this_mail_status").text(this_mail_status_ary[0] + mail_title_ary[curr_beat]);
                $(".this_mail_status").transition({"left": "0px"}, function(){
                    $(".this_mail_status").text("").transition({"left": "-380px"});
                });


                
            }
            else {
                beat_comment_text("miss");
            }
       }
    });

    function beat_comment_text(hit_type) {
        var comment_div = $('<span>').addClass("beat_comment_text");
        
        if (hit_type == "good") {
            var comment_img = $('<img>').attr("src", chrome.extension.getURL("images/hint/good_hint.png"));
        }
        else if (hit_type == "spam") {
            var comment_img = $('<img>').attr("src", chrome.extension.getURL("images/hint/spam_hint.png"));
        }
        else if (hit_type == "perfect") {
            var comment_img = $('<img>').attr("src", chrome.extension.getURL("images/hint/perfect_hint.png"));
        }
        else if (hit_type == "miss") {
            var comment_img = $('<img>').attr("src", chrome.extension.getURL("images/hint/miss_hint.png"));
        }

        comment_div.append(comment_img);
        $("body").append(comment_div);
        $(comment_div).animate({"opacity": "0"}, 600);

        $("comment_div").transition({
            "opacity": "0"
        }, 600, "snap");
        

    }

    $("body").keyup(function(event) {
        if ( event.which == beat_hit_key ) {
            $(".drum").css("background", "#FFFFFF");
        }
    });



    // beat_timer
    function beat_timer()
    {
        if (beat_counter < mail_title_ary.length)
        {
            var beat_box = document.createElement("div");
            var beat = document.createElement("img");
            var beat_text = document.createElement("div");

            $(beat_text).addClass("beat_text").text(mail_title_ary[beat_counter]);
            $(beat).addClass("beat").attr("id", "beat_" + beat_counter).attr("src", chrome.extension.getURL(beat_ary[parseInt(Math.random()*5)])).css("left", 100 + ((Math.random()*50)+1) + "%");
            $(beat_box).addClass("beat_box").attr("id", "beat_box_" + beat_counter);
            $(beat_box).append(beat_text).append(beat);
            $(".river").append(beat_box);

            beat_array.push(beat_counter);
            
            $(".beat_box").transition({
                left: "-10%"
            }, beat_speed, "linear" , function() {
                beat_array.shift();
                $(this).remove();
                //console.log("curr_counter = " + curr_counter);
                $("#mail_" + curr_counter).css({"background-color": "rgb(246, 191, 43)"});

                curr_counter = curr_counter + 1;
                
                if (curr_counter == mail_title_ary.length)
                {
                    // finish
                    console.log(mail_status_ary);
                    console.log(mail_comment_ary);
                    console.log(mail_score_ary);
                    dashboard();
                }

            });
            beat_counter = beat_counter + 1;
        }
        else {
            // stop
            window.clearInterval(beat_timer_func);
        }
    }

    // beat_overlap
    function beat_overlap(x1, x2, width ,fuzzy) {

        var first_left = x1 - width;
        var first_right = x1 + width;
        var second_left = x2 - width;
        var second_right = x2 + width;

        /*
        console.log("first_left = " + first_left);
        console.log("first_right = " + first_right);
        console.log("second_left = " + second_left);
        console.log("second_right = " + second_right);
        */

        // determine
        if (second_left > first_right) {
            //console.log("(" + x1 + ", " + x2 +  ") = yet");
            return "YET";
        } else if (first_right - second_left > width + width * fuzzy) {
            //console.log("(" + x1 + ", " + x2 +  ") = miss");
            return "MISS";
        } else {
            //console.log("(" + x1 + ", " + x2 +  ") = hit");
            var score = (first_right - second_left)/(width + (width * fuzzy));
            return score;
        }
    }


    yhack_get_ymail_list();



    function yhack_get_ymail_list() {
        $.ajax({
            type: "POST" ,
            url: 'http://us-mg5.mail.yahoo.com/ws/mail/v2.0/jsonrpc?appid=YahooMailNeo' ,
            data: JSON.stringify(yhack_list_mail_request) ,
            error: function(response) {
                token_url = response.responseJSON.error.detail.url ;

                $.ajax({
                    type: "POST" ,
                    url: token_url ,
                    data: JSON.stringify(yhack_list_mail_request) ,
                    success: function(response) {
                        
                        /* yhack_mail_board */
                        var yhack_mail_board  = $('<div>').addClass("yhack_mail_board");
                        var yhack_unread_mail  = $('<div>').addClass("yhack_unread_mail").text("未讀信件清單");

                        $("body").append(yhack_mail_board);

                        $(yhack_mail_board).transition({"height": "auto", "padding-bottom": "24px"}, 1000, "ease", function(){ 
                            
                            $(yhack_mail_board).append(yhack_unread_mail);

                            /* ymail api get mail */
                            var mail_list = response.result.conversations ;
                            
                            //for (var i=0;i<2;i++) {
                            for (var i in mail_list) {
                                var title = mail_list[i].conversation.summary.subject;
                                var cid = mail_list[i].conversation.cid;
                                var idate = mail_list[i].conversation.summary.iDate;

                                if (title == "") { title = "無標題信件"; }
                                //console.log(title + " = " + title.length);
                                
                                mail_title_ary.push(title);
                                mail_cid_ary.push(cid);
                                mail_idate_ary.push(idate);

                                mail_score_ary.push(0);
                                mail_comment_ary.push("");
                                mail_status_ary.push("");


                                //var yhack_unread_mail_title  = $('<span>').addClass("yhack_unread_mail_title").attr("id", "mail_" + i).text(title.substr(0,12));
                                //$(yhack_mail_board).append(yhack_unread_mail_title).fadeIn();
                            }


                            // this_mail_status
                            var this_mail_status = $('<div>').addClass("this_mail_status");
                            $("body").append(this_mail_status);    

                            /* yahck_delete_mail_request */
                            var yahck_delete_mail_request = {
                                "method":"BatchExecute" ,
                                "params": [{
                                "call": [{
                                    "MoveThreads": {
                                        "cids": [ mail_cid_ary[0] ],
                                        "snapshotTime": mail_idate_ary[0],
                                        "sourceFid": "Inbox",
                                        "destinationFid": "Trash"
                                    }}, { "ListFolders": {} }
                                ]}]
                            }

                            /*
                            for (var i in mail_title_ary) {
                                console.log('title: ' + mail_title_ary[i]);
                            }
                            */

                            var yhack_hint = $('<div>').addClass("hint").html(hint_text.replace("n", "<span class='top_mail_item'>" + mail_list.length + "</span>"));
                            yhack_yahoo_pool.append(yhack_hint);


                            $(".hint").click(function(){
                                $(this).remove();     
                                /* sound */
                                var sound = new Howl({ urls: [ soundtrack ], volume: 0.5 }).play();
                                beat_timer_func = setInterval(function(){ beat_timer() }, beat_sec);

                                console.log("total mail len = " + mail_title_ary.length);
                                console.log("total mail ary = " + mail_title_ary);
                            });    

                        });
                    
                    }
                }) ;
            }
        }) ;
    }

    function yhack_delete_ymail_list(token_url) {
        $.ajax({
            type: "POST",
            url: token_url,
            data: JSON.stringify(yahck_delete_mail_request),
            success: function(response) {
                console.log('title: "' + mail_title[0] + '" delete success!');
                console.log('press the inbox check mail button to confirm.');
            }
        });
    }
    


    /* dashboard */
    function dashboard() {
        var dashboard = document.createElement("div");
        var dashboard_mail_section = document.createElement("div");
        var dashboard_score_container = document.createElement("div");
        var dashboard_score_water = document.createElement("div");
        var dashboard_score_logo = document.createElement("img");

        $(dashboard_score_logo).addClass("dashboard_score_logo").attr("src", chrome.extension.getURL("images/logo/yahoo_logo_white.png"))

        $(dashboard_score_container).attr("id", "dashboard_score_container");
        $(dashboard_score_water).attr("id", "dashboard_score_water");
        $(dashboard).attr("id", "dashboard");
        $(dashboard_mail_section).addClass("dashboard_mail_section");
        
        $("body").append(dashboard);

        $(dashboard_score_container).append(dashboard_score_water);
        $(dashboard).append(dashboard_score_container);
        $(dashboard).append(dashboard_mail_section);
        $(dashboard).append(dashboard_score_logo);

        $(".dashboard_score_water").animate({"height": "500px"}, 2500);

        for(var i=0;i<mail_score_ary.length;i++){
            var dashboard_mail_list = document.createElement("div");
            var dashboard_mail_status_img = document.createElement("img");

            $(dashboard_mail_list).addClass("dashboard_mail_list").text(mail_title_ary[i]);

            if (mail_status_ary[i] == 'deleted') {
                $(dashboard_mail_status_img).addClass("dashboard_mail_status_img").attr("src", chrome.extension.getURL("images/dashboard/dashboard_deleted_small.png"));    
            }
            if (mail_status_ary[i] == '') {
                $(dashboard_mail_status_img).addClass("dashboard_mail_status_img").attr("src", chrome.extension.getURL("images/dashboard/dashboard_archived_small.png"));
            }
            else {
                $(dashboard_mail_status_img).addClass("dashboard_mail_status_img").attr("src", chrome.extension.getURL("images/dashboard/dashboard_archived_small.png"));
            }
            $(dashboard_mail_list).append(dashboard_mail_status_img);
            $(dashboard_mail_section).append(dashboard_mail_list);
        }

        var dashboard_score_text = document.createElement("div");
        $(dashboard_score_text).addClass("dashboard_score_text").text("0");

        $(dashboard_mail_section).append(dashboard_score_text);
        $('.dashboard_score_text').countTo({from: 0, to: 93434, speed: 2500});
    }    
    
    
    
});

})();




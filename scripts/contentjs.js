(function() {

$(document).ready(function() {

    var beat_sec = 1000;
    var beat_speed = 1000;
    var beat_counter = 0;
    var mail_title_ary = Array("test 1", "test 2", "test 3");
    var beat_array = Array();

    beat_timer_func = setInterval(function(){ beat_timer() }, beat_sec);

    function beat_timer()
    {
        if (beat_counter < mail_title_ary.length)
        {
            var beat_box = document.createElement("div");
            var beat = document.createElement("img");
            var beat_text = document.createElement("div");

            $(beat_text).addClass("beat_text").text(mail_title_ary[beat_counter]);
            $(beat).addClass("beat").attr("id", "beat_" + beat_counter).attr("src", chrome.extension.getURL("images/beat/beat_blue_medium.gif")).css("left", 100 + ((Math.random()*50)+1) + "%");
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
                }

            });
            beat_counter = beat_counter + 1;
        }
        else {
            // stop
            window.clearInterval(beat_timer_func);
        }
    }

    
});

})();
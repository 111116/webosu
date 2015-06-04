var fixableContainer=null;var footer=null;var frozenClone=null;function handleFrozenHeader()
{fixableContainer=$("#fixable");if(!fixableContainer.length)return;footer=$(".footer");$(window).resize(function(){if(frozenClone!==null)fixableContainer.css("left",(frozenClone.offset().left- $(window).scrollLeft())+'px');});$(window).scroll(handleFrozenScroll);}
function handleFrozenScroll()
{var fixableHeight=fixableContainer.height();var fixableWidth=fixableContainer.width();var fixableLeft=fixableContainer.offset().left;if(frozenClone!==null)fixableContainer.css("left",(frozenClone.offset().left- $(window).scrollLeft())+'px');if($(window).scrollTop()>=(frozenClone!==null?frozenClone:fixableContainer).offset().top)
{if(frozenClone===null)
{frozenClone=$("<div/>");frozenClone.addClass(fixableContainer.attr('class'));frozenClone.css('width',fixableWidth+'px');frozenClone.css('height',fixableHeight+'px');fixableContainer.before(frozenClone);fixableContainer.addClass(fixableContainer.is(".minimal")?"frozen-header minimal":"frozen-header").css("width",fixableWidth+'px').css("left",fixableLeft+'px').css("z-index",'9999');}
var top=Math.min(0,footer.offset().top- $(window).scrollTop()- 120- fixableHeight);fixableContainer.css("top",top+"px");}
else
{if(frozenClone!==null)
{frozenClone.remove();frozenClone=null;fixableContainer.removeClass("frozen-header").css("width",'').css("left",'');}}}
function handleClickableCells()
{var clickableCells=$(".clickable-cell");if(!clickableCells.length)return;clickableCells.click(function(){if($(this).find(".hovering").length)return true;loadUrl($(this).find("a:first").attr('href'));return false;});clickableCells.find("a").hover(function(){$(this).toggleClass('hovering',true);},function(){$(this).toggleClass('hovering',false);});}
function translate(langCode)
{location.href='http://www.google.com/translate?u='+encodeURIComponent(location.href)+'&langpair=en%7C'+langCode+'&hl=en&ie=UTF8';return false;}
function loadUrl(url){if(/MSIE (\d+\.\d+);/.test(navigator.userAgent))
{var referLink=document.createElement('a');referLink.href=url;document.body.appendChild(referLink);referLink.click();}else{location.href=url;}
return false;}
function urlencode(str){return escape(str).replace('+','%2B').replace('%20','+').replace('*','%2A').replace('/','%2F').replace('@','%40');}
function check(url,message)
{if(confirm("You are about to "+message+".\nAre you sure you want to do this?"))
loadUrl(url);}
function addCommas(nStr)
{nStr+='';x=nStr.split('.');x1=x[0];x2=x.length>1?'.'+ x[1]:'';var rgx=/(\d+)(\d{3})/;while(rgx.test(x1)){x1=x1.replace(rgx,'$1'+','+'$2');}
return x1+ x2;}
var prevTimeout=null;function expandRow(setId,instant)
{if($("#info"+ setId).is(':hidden'))
{if(prevTimeout!==null)
clearTimeout(prevTimeout);prevTimeout=setTimeout(function(){$(".expandableInfo").slideUp(200);$("#info"+ setId).slideDown(200);},instant?0:400);}}
function shrinkRows()
{if(prevTimeout!==null)
clearTimeout(prevTimeout);}
function helpClicked(id,n)
{$("#helpContent").slideUp(300);$("#helpLoading").fadeIn(500);$(".helpSquare").removeClass("helpSquareLarge");$(".helpSquare").addClass("helpSquareSmall");$("#helpContent").load("/pages/include/faq-section.php?id="+ id+"&n="+ n,{limit:25},function(){$("#helpContent").slideDown(500);$("#helpLoading").hide(0);});}
function helpJumpSection(id,c,n)
{$("#helpContent").slideUp(300);$("#helpLoading").fadeIn(500);$(".helpSquare").removeClass("helpSquareLarge");$(".helpSquare").addClass("helpSquareSmall");$("#helpContent").load("pages/include/faq-section.php?id="+ id+"&n="+ n,{limit:25},function(){$("#helpContent").slideDown(500);$("#helpLoading").hide(0);window.location=c;});}
function updateChat()
{$("#chat").load("/pages/include/home-ircfeed.php",{limit:25},function(){setTimeout(updateChat,10000);});}
function expandPack(id)
{if(id===null||id===undefined)return;if(!($("#"+ id).hasClass("expanded")))
{if(!$("#"+ id).hasClass("loaded"))
{$("#"+ id).html("<center>Loading...</center>");$.get("/pages/include/packlist-info.php?n="+ id,null,function(text){$("#"+ id).html(text);$("#"+ id).addClass("loaded");});}
$("#"+ id).slideDown(500);$("#"+ id).addClass("expanded");}
else
{$("#"+ id).slideUp("fast");$("#"+ id).removeClass("expanded");}}
var mcp_page=1;var mcp_forum='c';function mcpSetPage(page)
{mcp_page=page;return mcpProcess();}
function mcpNextPage()
{mcp_page++;return mcpProcess();}
function mcpPrevPage()
{if(mcp_page>1)mcp_page--;return mcpProcess();}
function mcpSetForum(f)
{if(mcp_forum!=f&&(f=='c'||f=='h'))
{mcp_forum=f;mcp_page=1;}
return mcpProcess();}
function mcpProcess()
{var options=($("#unmarked").attr("checked")?1:0)+
($("#starred").attr("checked")?2:0)+
($("#bubbled").attr("checked")?4:0)+
($("#zero").attr("checked")?8:0)+
($("#replied").attr("checked")?16:0)+
($("#difficulty").attr("checked")?32:0)+
($("#nuked").attr("checked")?64:0);$("#mcp-list").prepend("<center><h2>Loading...</h2></center>");$.get("/pages/include/modcp-list.php?p="+ mcp_page+"&f="+ mcp_forum+"&o="+ options+"&n="+($("#nmaps").attr("value")),null,function(text){$("#mcp-list").html(text);});return false;}
jQuery(function(){jQuery('ul.sf-menu').superfish();});(function($){$.fn.superfish=function(op){var sf=$.fn.superfish,c=sf.c,$arrow=$(['<span class="',c.arrowClass,'"> &#187;</span>'].join('')),over=function(){var $$=$(this),menu=getMenu($$);clearTimeout(menu.sfTimer);$$.showSuperfishUl().siblings().hideSuperfishUl();},out=function(){var $$=$(this),menu=getMenu($$),o=sf.op;clearTimeout(menu.sfTimer);menu.sfTimer=setTimeout(function(){o.retainPath=($.inArray($$[0],o.$path)>-1);$$.hideSuperfishUl();if(o.$path.length&&$$.parents(['li.',o.hoverClass].join('')).length<1){over.call(o.$path);}},o.delay);},getMenu=function($menu){var menu=$menu.parents(['ul.',c.menuClass,':first'].join(''))[0];sf.op=sf.o[menu.serial];return menu;},addArrow=function($a){$a.addClass(c.anchorClass).append($arrow.clone());};return this.each(function(){var s=this.serial=sf.o.length;var o=$.extend({},sf.defaults,op);o.$path=$('li.'+o.pathClass,this).slice(0,o.pathLevels).each(function(){$(this).addClass([o.hoverClass,c.bcClass].join(' ')).filter('li:has(ul)').removeClass(o.pathClass);});sf.o[s]=sf.op=o;$('li:has(ul)',this)[($.fn.hoverIntent&&!o.disableHI)?'hoverIntent':'hover'](over,out).each(function(){if(o.autoArrows)addArrow($('>a:first-child',this));}).not('.'+c.bcClass).hideSuperfishUl();var $a=$('a',this);$a.each(function(i){var $li=$a.eq(i).parents('li');$a.eq(i).focus(function(){over.call($li);}).blur(function(){out.call($li);});});o.onInit.call(this);}).addClass([c.menuClass,c.shadowClass].join(' '));};var sf=$.fn.superfish;sf.o=[];sf.op={};sf.IE7fix=function(){var o=sf.op;if($.browser.msie&&$.browser.version>6&&o.dropShadows&&o.animation.opacity!==undefined)
this.toggleClass(sf.c.shadowClass+'-off');};sf.c={bcClass:'sf-breadcrumb',menuClass:'sf-js-enabled',anchorClass:'sf-with-ul',arrowClass:'sf-sub-indicator',shadowClass:'sf-shadow'};sf.defaults={hoverClass:'sfHover',pathClass:'overideThisToUse',pathLevels:1,delay:400,animation:{opacity:'show'},speed:80,autoArrows:true,dropShadows:true,disableHI:false,onInit:function(){},onBeforeShow:function(){},onShow:function(){},onHide:function(){}};$.fn.extend({hideSuperfishUl:function(){var o=sf.op,not=(o.retainPath===true)?o.$path:'';o.retainPath=false;var $ul=$(['li.',o.hoverClass].join(''),this).add(this).not(not).removeClass(o.hoverClass).find('>ul').hide().css('visibility','hidden');o.onHide.call($ul);return this;},showSuperfishUl:function(){var o=sf.op,sh=sf.c.shadowClass+'-off',$ul=this.addClass(o.hoverClass).find('>ul:hidden').css('visibility','visible');sf.IE7fix.call($ul);o.onBeforeShow.call($ul);$ul.animate(o.animation,o.speed,function(){sf.IE7fix.call($ul);o.onShow.call($ul);});return this;}});})(jQuery);function popup(url,width,height)
{window.open(url.replace(/&amp;/g,'&'),'_popup','HEIGHT='+ height+',resizable=yes,scrollbars=yes, WIDTH='+ width);return false;}
function marklist(id,name,state)
{var parent=document.getElementById(id);if(!parent)
{eval('parent = document.'+ id);}
if(!parent)
{return;}
var rb=parent.getElementsByTagName('input');for(var r=0;r<rb.length;r++)
{if(rb[r].name.substr(0,name.length)==name)
{rb[r].checked=state;}}}
function toggleSpoiler(root)
{var spoiler=$(root).parents(".spoiler");spoiler.children(".spoiler_body").slideToggle("fast");spoiler.find('img').trigger('unveil');return false;}
function expandPost()
{$("#truncated").hide(0);$("#full").show(0);return false;}
function userSearch()
{document.location="/u/"+ encodeURIComponent($("#user-search").val());return false;}
function beatmapSearch()
{document.location="/p/beatmaplist?q="+ encodeURIComponent($("#beatmap-search").val());return false;}
function scrollTo(id,padding)
{if(padding===undefined)padding=0;$('html, body').animate({scrollTop:$(id).offset().top- $("#fixable").height()- padding},300,'swing');}
function scrollDown(id,padding)
{if(padding===undefined)padding=0;var newTop=$(id).offset().top- $("#fixable").height()- padding;if($('body').scrollTop()<newTop)return;$('html, body').animate({scrollTop:newTop},300,'swing');}
var myListener={};var isPlaying=false;var playingid=-1;myListener.onInit=function()
{this.position=0;};myListener.onUpdate=function()
{var newState=(this.isPlaying=="true");if(newState==isPlaying)return;isPlaying=newState;if(!isPlaying)
$('.bmlistt>.icon-pause').removeClass("icon-pause").addClass("icon-play");};function getFlashObject()
{var flash=$("#myFlash");if(flash.length===0)
{$('body').append('<div style="float:right;" id="flashpreview">'+'			<object class="playerpreview" id="myFlash" type="application/x-shockwave-flash" data="/images/mp3.swf" width="1" height="1">'+'				<param name="movie" value="/images/mp3.swf" />'+'				<param name="AllowScriptAccess" value="always" />'+'				<param name="FlashVars" value="listener=myListener&interval=500" />'+'			</object>'+'		</div>');}
return document.getElementById("myFlash");}
var queuedPlay;function play(id,iscallback)
{if(!iscallback)
stop();else if(queuedPlay)
{clearTimeout(queuedPlay);queuedPlay=null;}
if(isPlaying&&playingid==id)return false;setVolume(45);playingid=id;try{var flash=getFlashObject();flash.SetVariable("method:setUrl",STATIC_DOMAIN_BEATMAP+"/preview/"+ id+".mp3");flash.SetVariable("method:play","");flash.SetVariable("enabled","true");}catch(e){}
if(!isPlaying)
queuedPlay=setTimeout(function(){play(id,true);},500);return true;}
function stop()
{try{getFlashObject().SetVariable("method:stop","");}
catch(e){}
return false;}
function setVolume(volume)
{try{getFlashObject().SetVariable("method:setVolume",volume);}
catch(e){}}
function load(id,e)
{if(e.button!==1)
loadUrl("/s/"+ id);}
function flashLogin(elm,count,rate)
{if(count%2===0)
elm.css('border-left','solid 2px #df114f').css('border-bottom','solid 2px #df114f');else
elm.css('border-left','solid 2px #d7d4df').css('border-bottom','solid 2px #d7d4df');if(--count>0)
setTimeout(function(){flashLogin(elm,count,rate);},rate);}
function flashLoginForm()
{$(".login-dropdown").slideDown(100,function(){flashLogin($(".login-dropdown"),10,100);});scrollTo('body');$("#username-field").select();return false;}
function showLoginForm()
{if($(this).hasClass("require-login"))
{flashLoginForm();return;}
$(".login-dropdown").slideToggle(100);scrollTo('body');$("#username-field").select();return false;}
(function($){$.fn.textWidth=function(){var html_org=$(this).html();var html_calc='<span>'+ html_org+'</span>';$(this).html(html_calc);var width=$(this).find('span:first').width();$(this).html(html_org);return width;};$.fn.marquee=function(args){var that=$(this);var textWidth=that.textWidth(),actualWidth=that.width(),offset=0,width=0,css={'text-indent':that.css('text-indent'),'overflow':that.css('overflow'),'white-space':that.css('white-space')},marqueeCss={'text-indent':width,'overflow':'hidden','white-space':'nowrap'},args=$.extend(true,{count:-1,speed:1e1,leftToRight:false},args),i=0,stop=(actualWidth- textWidth),dfd=$.Deferred();if(textWidth<actualWidth||that.attr('stop')==-1)
return;that.attr('stop',-1);function go(){if(!that.length)return dfd.reject();if(that.attr('stop')>=0)
{that.css(css);that.attr('stop',0);return dfd.resolve();}
if(width==stop){i++;if(i>=args.count){setTimeout(go,args.speed);return;}
if(args.leftToRight){width=textWidth*-1;}else{width=offset;}}
that.css('text-indent',width+'px');if(args.leftToRight){width++;}else{width--;}
setTimeout(go,args.speed);}
if(args.leftToRight){width=textWidth*-1;width++;stop=offset;}else{width--;}
that.css(marqueeCss);go();return dfd.promise();};})(jQuery);(function(factory){if(typeof define==='function'&&define.amd){define(['jquery'],factory);}else{factory(jQuery);}}(function($){$.timeago=function(timestamp){if(timestamp instanceof Date){return inWords(timestamp);}else if(typeof timestamp==="string"){return inWords($.timeago.parse(timestamp));}else if(typeof timestamp==="number"){return inWords(new Date(timestamp));}else{return inWords($.timeago.datetime(timestamp));}};var $t=$.timeago;$.extend($.timeago,{settings:{refreshMillis:60000,allowFuture:true,localeTitle:false,strings:{prefixAgo:null,prefixFromNow:null,suffixAgo:"ago",suffixFromNow:"from now",seconds:"less than a minute",minute:"about a minute",minutes:"%d minutes",hour:"about an hour",hours:"about %d hours",day:"a day",days:"%d days",month:"about a month",months:"%d months",year:"about a year",years:"%d years",wordSeparator:" ",numbers:[]}},inWords:function(distanceMillis){var $l=this.settings.strings;var prefix=$l.prefixAgo;var suffix=$l.suffixAgo;if(this.settings.allowFuture){if(distanceMillis<0){prefix=$l.prefixFromNow;suffix=$l.suffixFromNow;}}
var seconds=Math.abs(distanceMillis)/ 1000;
var minutes=seconds/60;var hours=minutes/60;var days=hours/24;var years=days/365;function substitute(stringOrFunction,number){var string=$.isFunction(stringOrFunction)?stringOrFunction(number,distanceMillis):stringOrFunction;var value=($l.numbers&&$l.numbers[number])||number;return string.replace(/%d/i,value);}
var words=seconds<45&&substitute($l.seconds,Math.round(seconds))||seconds<90&&substitute($l.minute,1)||minutes<45&&substitute($l.minutes,Math.round(minutes))||minutes<90&&substitute($l.hour,1)||hours<48&&substitute($l.hours,Math.round(hours))||days<30&&substitute($l.days,Math.round(days))||days<45&&substitute($l.month,1)||days<365&&substitute($l.months,Math.round(days/30))||years<1.5&&substitute($l.year,1)||substitute($l.years,Math.round(years));var separator=$l.wordSeparator||"";if($l.wordSeparator===undefined){separator=" ";}
return $.trim([prefix,words,suffix].join(separator));},parse:function(iso8601){var s=$.trim(iso8601);s=s.replace(/\.\d+/,"");s=s.replace(/-/,"/").replace(/-/,"/");s=s.replace(/T/," ").replace(/Z/," UTC");s=s.replace(/([\+\-]\d\d)\:?(\d\d)/," $1$2");return new Date(s);},datetime:function(elem){var iso8601=$t.isTime(elem)?$(elem).attr("datetime"):$(elem).attr("title");return $t.parse(iso8601);},isTime:function(elem){return $(elem).get(0).tagName.toLowerCase()==="time";}});var functions={init:function(){var refresh_el=$.proxy(refresh,this);refresh_el();var $s=$t.settings;if($s.refreshMillis>0){setInterval(refresh_el,$s.refreshMillis);}},update:function(time){if(time===undefined)
$(this).removeData('timeago');else
$(this).data('timeago',{datetime:$t.parse(time)});refresh.apply(this);}};$.fn.timeago=function(action,options){var fn=action?functions[action]:functions.init;if(!fn){throw new Error("Unknown function name '"+ action+"' for timeago");}
this.each(function(){fn.call(this,options);});return this;};function refresh(){var data=prepareData(this);if(!isNaN(data.datetime)){$(this).text(inWords(data.datetime));}
return this;}
function prepareData(element){element=$(element);if(!element.data("timeago")){element.data("timeago",{datetime:$t.datetime(element)});var text=$.trim(element.text());if($t.settings.localeTitle){element.attr("title",element.data('timeago').datetime.toLocaleString());}else if(text.length>0&&!($t.isTime(element)&&element.attr("title"))){element.attr("title",text);}}
return element.data("timeago");}
function inWords(date){return $t.inWords(distance(date));}
function distance(date){return(new Date().getTime()- date.getTime());}
document.createElement("abbr");document.createElement("time");}));$(document).ready(function(){$(".login-open-button").click(showLoginForm);if(!("localUserId"in window)||localUserId<=1)$(".require-login").attr('href','#').click(showLoginForm);$("#pagecontent img").hover(function(){if($(this).width()>=660)
$(this).addClass("expandable");},function(){$(this).removeClass("expandable");});$("#pagecontent img").click(function(){$(this).toggleClass("expanded");});$('#quickreply-text').keydown(function(e){if(e.ctrlKey&&e.keyCode==13){$("#quickreplyform").submit();return false;}});$(".timeago").timeago();$.getScript(STATIC_DOMAIN+'/js/jquery.autocomplete.js',function(){$('#user-search').autocomplete({serviceUrl:'/p/profile?check=1',onSelect:function(value,data){userSearch();return false;}});});handleFrozenHeader();handleClickableCells();$(".beatmap").hover(function(){$(this).find(".maintext").marquee({speed:60});$(this).find(".initiallyHidden").stop().fadeTo(1,100);$(this).find(".bmlist-options").clearQueue().stop().delay(500).animate({width:'show'},100);},function(){$(this).find(".initiallyHidden").fadeOut(400);$(this).find(".maintext").attr('stop',1);$(this).find(".bmlist-options").clearQueue().stop().delay(500).animate({width:'hide'},100);}).click(function(event){return load(this.id,event);});$(".bmlist-options .icon-heart").click(function(){$.ajax({url:"/web/favourite.php?localUserCheck="+ localUserCheck+"&a="+$(this).parent().parent().parent().attr('id')}).done(function(){alert("Added as favourite!");});return false;});$(".bmlistt").click(function(){$('.bmlistt>.icon-pause').removeClass("icon-pause").addClass("icon-play");if(play($(this).parent().attr('id')))
$(this).find('i').removeClass("icon-play").addClass("icon-pause");return false;});});$(window).load(function(){applyAfterLoad();});function showBeMySupporter()
{$.get("/p/be_my_supporter",function(data){$("body").append(data).fadeInFromZero(200);});}
function downloadMap()
{if(downloadCount==20||(downloadCount>0&&downloadCount%50===0))
setTimeout(showBeMySupporter,200);downloadCount++;}
function applyAfterLoad()
{$(".lazy-load").unveil(600,function(){$(this).load(function(){this.style.opacity=1;});});$(".beatmap_download_link").bind("click",downloadMap);};(function($){$.fn.unveil=function(threshold,callback){var $w=$(window),th=threshold||0,retina=window.devicePixelRatio>1,attrib=retina?"data-src-retina":"data-src",images=this,loaded;this.one("unveil",function(){var source=this.getAttribute(attrib);source=source||this.getAttribute("data-src");if(source){this.setAttribute("src",source);if(typeof callback==="function")callback.call(this);}});function unveil(){var inview=images.filter(function(){var $e=$(this);if($e.is(":hidden"))return;var wt=$w.scrollTop(),wb=wt+ $w.height(),et=$e.offset().top,eb=et+ $e.height();return eb>=wt- th&&et<=wb+ th;});loaded=inview.trigger("unveil");images=images.not(loaded);}
$w.on("scroll.unveil resize.unveil lookup.unveil",unveil);unveil();return this;};})(window.jQuery||window.Zepto);
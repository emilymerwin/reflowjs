var directory;
var client;
var skybox = "#skybox";
var form;
var O;
var ul;
var skyboxHTML;

var elementtest;



function textToTable(element, target) {
  contents = element.val();
  rows = contents.trim().split("\n");
  html = "<table>\n";
  html += "<tr><th>";
  html += rows.shift().split("\t").join("</th><th>");
  html += "</th></tr>\n";

  while (rows.length > 0) {
      html += "<tr><td>";
      html += rows.shift().split("\t").join("</td><td>");
      html += "</td><td>\n";
  }
  html +="</table>";
  target.text(html);
}



// create a JS object by having a function return itself
function admin( options ) {

  //set default options
  this.options = {
    client: null,
    form: '#adminForm',
    skybox: '#skyBoxForm',
    folder: '',
    drafts: '/Drafts',
    published: '/Published',
    webUrl: 'index.html',
    previewUrl: 'preview.html',
    data: {}
  }

  // pass in the actual options
  $.extend(this.options, options);


  // create a local variable for the client
  client = this.options.client;

  // authenticate
  client.authenticate();

  // load initial data (normally blank)
  this.data = this.options.data;

  // load the form selector
  this.form = this.options.form;

  // start with empty list of entries
  this.entries = [];

  // define the object's methods
  // (technically these are attributes containing functions)
  // load entries
  this.loadEntries = function() {
    // create a variable we can pass to callbacks
    this_admin = this;
    $(skybox).html(skyboxHTML);
    client.readdir(this.options.folder+this.options.drafts, function (error, entries) {
      this.drafts = entries;
      var skyboxList = skybox + " #skyboxDraftList";
      //$(skyboxList).html();
      for (entry in entries) {
        if (entries[entry].match(/\.json$/)) {
          idString  = entries[entry].replace(/\.json$/,'').replace(/\//g,'');
          name = idString.replace(/[\W_]/g, ' ');
          if (this.options.folder+this.options.drafts + entries[entry] == this.data.file_name) {
            $(skyboxList).append("<option class='filename' id='"+idString+"' selected='selected'>"+name+"</option>");
          } else {
            $(skyboxList).append("<option class='filename' id='"+idString+"'>"+name+"</option>");
          }
        }
      }

      $("#skyboxDraftList option.filename").on("click", function (event) {this_admin.load(this.id+".json")});
      //$("#"+(this.data.file_name||"nothing").replace(/.json/,"")).click();
    });
    client.readdir(this.options.folder+this.options.published, function (error, entries) {
      this.published = entries;
      var skyboxList = skybox + " #skyboxPubList";
      for (entry in entries) {
        if (entries[entry].match(/\.json$/)) {
          idString  = entries[entry].replace(/\.json$/,'').replace(/\//g,'');
          name = idString.replace(/[\W_]/g, ' ');
          if (this.options.folder+this.options.published + entries[entry] == this.data.file_name) {
            $(skyboxList).append("<option class='filename' id='"+idString+"' selected='selected'>"+name+"</option>");
          } else {
            $(skyboxList).append("<option class='filename' id='"+idString+"'>"+name+"</option>");
          }
        }
        $("#skyboxPubList option.filename").on("click", function (event) {this_admin.load(this.id+".json", 'published'); console.log("t")});
      }
    });
  };

  // create
  this.create = function() {
    // create a variable we can pass to callbacks
    this_admin = this;
    this.data = {};
    this.data.name = window.prompt("Enter name of a new subject","");
    this.data.file_name = this.options.folder+this.options.drafts+'/' + this.data.name.toLowerCase().replace(/\W+/g, '_') + '.json';
    if (this.entries.indexOf(this.data.file_name)>-1) {
        //silently fail, keeping the old one
    } else {
        this.write();
    }
    this.data.url = this.data.file_name;
    $('.publishing').unbind('click').removeClass('unpublish').addClass('publish').text('Publish');
    $("button.publish").click(function(e){O.publish();return false;});
  };

  this.load = function (name, draft) {
    // create a variable we can pass to callbacks
    this_admin = this;
    form.find("input, textarea").val("");
    form.find("a#url, a#webUrl, a#previewUrl").text("this will populate automatically").prop("href","");
    $("button#reset").click();
    if (draft == 'published'){
      this.data.file_name = this.options.folder + this.options.published+'/' + name;
      $('.publishing').unbind('click').removeClass('publish').addClass('unpublish').text('Unpublish');
      $("button.unpublish").click(function(e){O.unpublish();return false;});
    }
    else {
      this.data.file_name = this.options.folder + this.options.drafts +'/'+ name;
      $('.publishing').unbind('click').removeClass('unpublish').addClass('publish').text('Publish');
      $("button.publish").click(function(e){O.publish();return false;});
    }
    thisFileName = this.data.file_name;
    client.readFile(this.data.file_name, function (error, results) {
      if (error) {
        return error;
      } else {
        //this.data.file_name  = name;
        this.data = JSON.parse(results);
        this.data.file_name = thisFileName;
        thisObit = this;
        if (draft == "published") {
          this.makeUrl();
        } else {
          $("#webUrl").text("View preview");
          $("#webUrl").attr("href",this.data.previewUrl);
        }
        $("input, textarea").each(function (i, el) {
          if (this_admin.data.hasOwnProperty(el.id)) {
            el.value=this_admin.data[el.id];
          }
        });
        $("textarea.mdhtmlform-md").keyup();
      }
    });
  }

  this.makeUrl = function () {
    client.makeUrl(this.data.file_name, {downloadHack: true},
    function (error, result) {
      if (error) {
      } else {
        this.data.url = result.url;
        webUrl = this.options.webUrl +"?file=" + result.url.replace(/https?\:\/\//,"");
        thisObit.data.url = result.url;
        thisObit.data.webUrl = webUrl;
        $("#webUrl").text("View live");
        $("#webUrl").attr("href",this.data.webUrl);
      }
    });
  }

  this.json = function () {
    return JSON.stringify(this.data);
  }

  this.write = function() {
    // create a variable we can pass to callbacks
      this_admin = this;
      this.data.previewUrl = this.options.previewUrl+"?file="+this.data.file_name;
      client.writeFile(this.data.file_name, this.json(), function () {this_admin.loadEntries();});
  }

  this.save = function () {
    // create a variable we can pass to callbacks
    this_admin = this;

    $(form).find("input, textarea").each(function (i, element) {
      if (element.name) {
        if (!element.value&&this_admin.data.hasOwnProperty(element.name)) {
          this_admin.data[element.name] = "";
        } else if (element.value){
          console.log(element.value);
          this_admin.data[element.name] = element.value.trim();
          this_admin.data[element.id] = element.value.trim();
        }
      }
    });
    this.data.mugshotName = this.data.name;
    this.write();
    alert("Changes saved");

  }

  this.publish = function () {
    var oldName = this.data.file_name;
    this.data.file_name = this.data.file_name.replace(this.options.drafts, this.options.published);
    client.delete(oldName);
    this.write();
    this.load(this.name, 'published');

  }

  this.unpublish = function () {
    var oldName = this.data.file_name;
    this.data.file_name = this.data.file_name.replace(this.options.published, this.options.drafts);
    this.write();
    client.delete(oldName);
    this.load(this.name, 'draft');
  }

  this.rename = function (newName) {
    var oldName = this.data.file_name;
    if (oldName.search(this.data.published) >= 0 ) {
      this.data.file_name = this.options.published + '/' + newName;
    } else {
      this.data.file_name = this.options.drafts + '/' + newName;
    }
    this.save();
    client.delete(oldName);
    window.reload();
  }

  this.deleteFile = function () {
    del = prompt("Enter 'Yes, please' to delete.");
    if (del == 'Yes, please') {
      client.delete(this.data.file_name,  function () {
        this.loadEntries();
      });

    } else {
      alert('Delete canceled.');
    }

  }
  // load the initial set of entries
  this.loadEntries();

  // return the function as a JS object
  return this;
}

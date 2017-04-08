function myFunction() {
  var apiUrl = 'https://ofbj941xef.execute-api.us-east-1.amazonaws.com/prod/getFinalScore';
  var nameCol = 2;
  var dayCol = 4;

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var values = sheet.getRange(5, nameCol, 55, 1).getValues();
  var names = values.map(function(a) { return a[0]; }).filter(function(v) { return v; });
  var fetchUrl = apiUrl + '?names=' + names.join(',');
  //Logger.log(fetchUrl);
  var res = UrlFetchApp.fetch(fetchUrl);
  var resObj = JSON.parse(res.getContentText());
  //Logger.log(resObj);
  for (var i = 5; i < 60; i++) {
    var cell = sheet.getRange(i, nameCol);
    var nameVal = cell.getValues()[0];
    if (nameVal && resObj[nameVal]) {
      sheet.getRange(i, dayCol).setValue(resObj[nameVal]);
    }
  }
}

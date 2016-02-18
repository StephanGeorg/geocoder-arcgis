
var should          = require('should'),
    GeocoderArcGIS  = require('../lib/geocoder-arcgis');

describe('GeocoderArcGIS API Wrapper', function(){
  var geocoder;

  describe('Initializating', function() {

    it('without any arguments', function() {
      (function() {
        geocoder = new GeocoderArcGIS();
      }).should.not.throw();
    });

    it('with additional arguments', function() {
      geocoder= new GeocoderArcGIS({
        client_id: '',
        client_secret: ''
      });

    });

  });


  describe('API responses', function() {

    beforeEach(function(done){
      geocoder = new GeocoderArcGIS();
      done();
    });


    it('should be able to geocode', function(done) {
      geocoder.geocode('Berlin').then(function(res) {
        res.should.be.json;
        done();
      });
    });

    it('should be able to reverse geocode', function(done) {
      geocoder.reverse('51.484463,-0.195405').then(function(res) {
        res.should.be.json;
        done();
      });
    });

    it('should be able to suggest', function(done) {
      geocoder.suggest('Glogauer Straße, Berlin').then(function(res) {
        res.should.be.json;
        done();
      });
    });

  });

});

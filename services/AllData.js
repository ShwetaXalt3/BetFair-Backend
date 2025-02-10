const AllData = {
    data: {
      eventId: null,
      competitionId: null,
      event: null,
      match: null,
      matchh:null, 
      tournament: null,
      funds: null
    },
    setEventCompetition(eventId, competitionId) {
      this.data.eventId = eventId;
      this.data.competitionId = competitionId;
    },
    getEventCompetition() {
      return { eventId: this.data.eventId, competitionId: this.data.competitionId };
    },
   
    event: function (eventData) {
    //   console.log("Received Event Data:", eventData);
      this.data.event = eventData; 
    },
   
    match: function (matchData) {
    //   console.log("Received Match Data:", matchData);
      this.data.match = matchData; 
    },
    matchh: function(matchData){
      this.data.matchh = matchData;
      // console.log(matchData);
      
    },
   
    tournament: function (tournamentData) {
    //   console.log("Received Tournament Data:", tournamentData);
      this.data.tournament = tournamentData;
    },
   
    funds: function (fundData) {
    //   console.log("Received Fund Data:", fundData);
      this.data.funds = fundData; 
    },
   
    getAllData: function () {
      return this.data; 
    }
  };
   
  module.exports = AllData;
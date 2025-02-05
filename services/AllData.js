const AllData = {
    data: {
      event: null,
      match: null,
      tournament: null,
      funds: null
    },
   
    event: function (eventData) {
    //   console.log("Received Event Data:", eventData);
      this.data.event = eventData; 
    },
   
    match: function (matchData) {
    //   console.log("Received Match Data:", matchData);
      this.data.match = matchData; 
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
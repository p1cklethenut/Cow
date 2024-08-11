declare global {
  type userobj = {
    [key: string]: {
      cows: number;
      name: string;
      skins: { [key: string]: boolean };
    };
  };
  type mainpageconnections = { [key: string]: string[] };
  type dataobjtype = { clicks: number; users: userobj };
  type playerdata = { clicks: number; socketid: string };
  type dueldata = {
    player1: playerdata;
    player2: playerdata;
  };
  interface onlinetodueldata {
    online: boolean;
    socketid: string;
  }
  type Skin = {
    src: string;
    name: string;
    rarity: string;
    cost: number;
    color: string;
  };
  type SkinList = {
    [key: string]: Skin;
  };
  type userlbdata = {
    id: string;
    name: string;
    cows: number;
  };
  type multilistelement = null | { [key: string]: number };

  type chancedataelemenet = { name: string; weight: number };

  type userplacementobj = { [key: string]: { [key: string]: number } };
  type usersplacementsortingtype = [string, number];
}
export {};

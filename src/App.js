import React, { Component } from 'react';
import './App.css';
import queryString from 'query-string';

let defaultStyle = {
  color: '#fff'
};
// let fakeServerData = {
//   user: {
//     name: 'Colin',
//     playlists: [
//       {
//         name: 'My favorites',
//         songs: [
//           { name: 'Beat It', duration: 1345 },
//           { name: 'Canneloni Macaroni', duration: 1236 },
//           { name: 'Rosa helicopter', duration: 70000 }
//         ]
//       },
//       {
//         name: 'Discover Weekly',
//         songs: [
//           { name: 'Beat It', duration: 1345 },
//           { name: 'Canneloni Macaroni', duration: 1236 },
//           { name: 'Rosa helicopter', duration: 70000 }
//         ]
//       },
//       {
//         name: 'Another playlist - the best!',
//         songs: [
//           { name: 'Beat It', duration: 1345 },
//           { name: 'Hallelujah', duration: 1236 },
//           { name: 'Rosa helicopter', duration: 70000 }
//         ]
//       },
//       {
//         name: 'Playlist - yeah!',
//         songs: [
//           { name: 'Beat It', duration: 1345 },
//           { name: 'Canneloni Macaroni', duration: 1236 },
//           { name: 'Ow ow ow', duration: 70000 }
//         ]
//       }
//     ]
//   }
// };

class PlaylistCounter extends Component {
  render() {
    return (
      <div style={{ ...defaultStyle, width: '40%', display: 'inline-block' }}>
        <h2>{this.props.playlists.length} playlists</h2>
      </div>
    );
  }
}

class HoursCounter extends Component {
  render() {
    let allSongs = this.props.playlists.reduce((songs, eachPlayList) => {
      return songs.concat(eachPlayList.songs);
    }, []);
    let totalDuration = allSongs.reduce((sum, eachSong) => {
      return (sum += eachSong.duration);
    }, 0);

    return (
      <div style={{ ...defaultStyle, width: '40%', display: 'inline-block' }}>
        <h2>{Math.round(totalDuration / 3600)} hours</h2>
      </div>
    );
  }
}

class Filter extends Component {
  render() {
    return (
      <div style={defaultStyle}>
        <img src="" alt="" />
        <input
          type="text"
          onKeyUp={event => this.props.onTextChange(event.target.value)}
        />
      </div>
    );
  }
}

class Playlist extends Component {
  render() {
    let playlist = this.props.playlist;
    return (
      <div style={{ ...defaultStyle, display: 'inline-block', width: '25%' }}>
        <img
          src={playlist.imageUrl ? playlist.imageUrl : require('./record.jpg')}
          style={{ width: '60px' }}
          alt=""
        />
        <h3>{playlist.name}</h3>
        <ul>{playlist.songs.map(song => <li>{song.name}</li>)}</ul>
      </div>
    );
  }
}

class App extends Component {
  constructor() {
    super();
    this.state = {
      serverData: {},
      filterString: ''
    };
  }

  componentDidMount() {
    let parsed = queryString.parse(window.location.search);
    let accessToken = parsed.access_token;

    if (!accessToken) return;

    fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: 'Bearer ' + accessToken }
    })
      .then(response => response.json())
      .then(data =>
        this.setState({
          user: {
            name: data.display_name
          }
        })
      );

    fetch('https://api.spotify.com/v1/me/playlists', {
      headers: { Authorization: 'Bearer ' + accessToken }
    })
      .then(response => response.json())
      .then(playlistData => {
        let playlists = playlistData.items

        let trackDataPromises = playlists.map(playlist => {
          let responsePromise = fetch(playlist.tracks.href, {
            headers: { Authorization: 'Bearer ' + accessToken }
          })
          let trackDataPromise = responsePromise
            .then(response => response.json())
          return trackDataPromise
      })

      let allTracksDataPromises = 
        Promise.all(trackDataPromises)

      let playlistsPromise = allTracksDataPromises.then(trackDatas => {
        trackDatas.forEach((trackData, i) => {
          playlists[i].trackDatas = trackData.items
            .map(item => item.track)
            .map(trackData => ({
              name: trackData.name,
              duration: trackData.duration_ms / 1000
            }))
        })
        return playlists
      })

      return playlistsPromise
      })
      .then(playlists => this.setState({
          playlists: playlists.map(item => {
            return {
              name: item.name,
              imageUrl: item.images[0].url ? item.images[0].url : null,
              songs: item.trackDatas.slice(0,3)
            }
          })
        }))

  }

  render() {
    let playlistsToRender =
      this.state.user && this.state.playlists
        ? this.state.playlists.filter(playlist => {
          let matchesPlaylist = playlist.name.toLowerCase().includes(this.state.filterString.toLowerCase())
          let matchesSong = playlist.songs.find(song => song.name.toLowerCase().includes(this.state.filterString.toLowerCase()))
          return matchesPlaylist || matchesSong
          })
        : [];
    return (
      <div className="App">
        {this.state.user ? (
          <div>
            <h1 style={{ ...defaultStyle, fontSize: '54px' }}>
              {this.state.user.name}'s Playlist
            </h1>
            <PlaylistCounter playlists={playlistsToRender} />
            <HoursCounter playlists={playlistsToRender} />
            <Filter
              onTextChange={text => {
                this.setState({ filterString: text });
              }}
            />
            {playlistsToRender.map(playlist => (
              <Playlist playlist={playlist} />
            ))}
          </div>
        ) : (
          <button
            onClick={() => {
              window.location = window.location.href.includes('localhost')
                ? 'http://localhost:8888/login'
                : 'https://better-playlists-test-backend.herokuapp.com/login';
            }}
            style={{ padding: '20px', fontSize: '50px', marginTop: '20px' }}
          >
            Sign in with Spotify
          </button>
        )}
      </div>
    );
  }
}

export default App;

import React, { Component } from 'react';
import 'reset-css/reset.css'
import './App.css';
import queryString from 'query-string';

let defaultStyle = {
  color: '#fff',
  fontFamily: 'Roboto, sans-serif'
};
let counterStyle = {...defaultStyle,
  width: '40%',
  display: 'inline-block',
  marginBottom: '10px',
  fontSize: '20px',
  lineHeight: '30px'
}

function isEven(number) {
  return number % 2
}

class PlaylistCounter extends Component {
  render() {
    let playlistCounterStyle = counterStyle
    return (
      <div style={playlistCounterStyle}>
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
    }, 0)
    let totalDurationHours = Math.round(totalDuration / 60)
    let isTooLow = totalDurationHours < 40 
    let hoursCounterStyle = {...counterStyle, 
      color: isTooLow ? 'red' : 'white',
      fontWeight: isTooLow ? 'bold' : 'normal'
    }
    return (
      <div style={hoursCounterStyle}>
        <h2>{totalDurationHours} hours</h2>
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
          style={{...defaultStyle, color: 'black', fontSize: '20px', padding: '10px', marginBottom: '10px'}}
        />
      </div>
    );
  }
}

class Playlist extends Component {
  render() {
    let playlist = this.props.playlist;
    return <div style={{...defaultStyle, display: 'inline-block', width: '25%', padding: '10px', backgroundColor: isEven(this.props.index) ? '#C0C0C0' : '#808080'}}>
        <h2 style={{fontWeight: 'bold', fontSize: '30px'}}>{playlist.name}</h2>
        <img src={playlist.imageUrl ? playlist.imageUrl : require('./record.jpg')} style={{width: '60px'}} alt="" />
        <ul style={{marginTop: '10px'}}>
          {playlist.songs.map(song => (
            <li style={{paddingBottom: '10px'}}>{song.name}</li>
          ))}
        </ul>
      </div>
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
            <h1 style={{ ...defaultStyle, 
            fontSize: '54px',
            marginTop: '5px'
            }}>
              {this.state.user.name}'s Playlist
            </h1>
            <PlaylistCounter playlists={playlistsToRender} />
            <HoursCounter playlists={playlistsToRender} />
            <Filter
              onTextChange={text => {
                this.setState({ filterString: text });
              }}
            />
            {playlistsToRender.map((playlist, i) => (
              <Playlist playlist={playlist} index={i} />
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

# Model Train Automation - RFID Demo Layout

Welcome to the Model Train Auotmation's RFID Demo Layout site. The following details describe how to build the RFID demo layout that was demonstrated at the Southampton Model Railway exhibition in July 2022. We hope that you can use these to build your own test layout and give you a platform to incorporate RFID into your very own layout!

The site tries to provide a comprehensive set of instructions on how we built the demo layout and how you could replicate this at home. We are keen to hear feedback, but unfortunately we can't take any requests to update the software to meet individual needs. The software and configuration is more to showcase what is possible.

The software used is very basic for demonstration purposes, but the possibilties and functionality are endless with RFID. The software has the following functionality:

    - Identifies a RFID tag that is presented to the RFID reader
    - Converts the RFID tag to a rolling stock item
    - Links the RFID reader, track layout block and the identified stock item
    - Publishes track block details over MQTT to be consumed by 'listeners'
    - Displays the pubished block details on a web page to get a visual representation of the layout

## Possabilities
With RFID and the knowledge of where stock items are located you can...
    - Identify if a train has split and parts of the train are left

## Layout Design
####  Demo Layout
![RFID Demo Layout](./Images/RFIDDemoLayout.PNG)    

## Hardware Requirements:
    - Raspbery Pi 3b + 16GB MicroSD card
    - Power Adaptor
    - Monitor
    - Keyboard & Mouse 
    - 2x Eccel Pepper C1 Mux RFID Reader Boards
    - 2x 5v power supplies for Pepper boards
    - 10x Eccel Antennas
    - 10x Tags for Stock Items 
    - 10x Stock Items to track
    - Internet connection

### Hardware Links
Tags:
- Tags: [midas tiny ntag213](https://zipnfc.com/nfc-sticker-midas-tiny-ntag213.html)

Eccel RFID 13.56Mhz Reader Single Antenna:
- Reader: [RFID NFC Pepper Wireless C1 EA USB](https://eccel.co.uk/product/pepper-wireless-c1-ea-usb/)
- Antenna: [RFID NFC-ANT1356-50×50-300](https://eccel.co.uk/product/rfid-ant1356-50x50-300/)
- Antenna: [RFID NFC-ANT1356-10×50-300](https://eccel.co.uk/product/rfid-ant1356-10x50-300/)

Eccel RFID 13.56Mhz Readers Multi Antennas:
- Reader: [RFID NFC Pepper C1 MUX USB](https://eccel.co.uk/product/pepper-c1-mux-usb/)
- Antenna: [RFID NFC MUX ANT1356-25×25-300](https://eccel.co.uk/product/mux-ant1356-25x25-300/)
- Antenna: [RFID NFC MUX ANT1356-10×50-300](https://eccel.co.uk/product/mux-ant1356-10x50-300/)

Eccel RFID / Model Train Flyer:
- Eccel: [Multiplexed RFID- Keeping multiple antennas "on track"](https://eccel.co.uk/our-case-studies/multiplexed-rfid-keeping-multiple-antennas-on-track/)

## Raspberry Pi Connection
The Raspberry Pi will need to be connected to the internet to allow it to download software and its configuration. Due to using the wireless module for the RFID readers, the Pi needs to be connected with an ethernet cable to your network.
    
## Install Raspberry Pi OS onto MicroSD card from Windows:
    - Inject MicroSD card into card reader
    - Download Raspberry Pi Imager v1.7.2
        - Select DC Card
        - Select OS - “Raspberry Pi OS (32-Bit) - Bullseye – with Pi Desktop (Recommended)”
        - Click cog icon
            -   Select hostname, enter 'rfiddemo'
            -   Select Enable SSH, use password authentication
            -   Select username and password, Username = pi, Password rfiddemo
            - Unselect Configure wireless Lan
            - Set local settings
            - Click Save button
        - Select Write
    - Insert MicroSD card into Raspberry Pi and power on
    - Wait for the Raspberry Pi desktop system to launch - you will then be ready for the next part

## Raspberry Pi software install & configuration
Ensure the OS has all the latest security patches, and features are installed, including the software to run the demo layout.

### Update OS Packages
Click terminal icon on the task bar and enter the following commands:

    - sudo apt update
    - sudo apt list --upgradable
    - sudo apt upgrade
    - sudo apt install samba samba-common-bin hostapd dnsmasq
    - Install docker 
        - https://www.simplilearn.com/tutorials/docker-tutorial/raspberry-pi-docker
        - curl -fsSL https://get.docker.com -o get-docker.sh
        - sudo sh get-docker.sh
### Configure Software:

    - Turn off Screen Blank

    - Setup file share
        - sudo mkdir /app
        - sudo chown pi /app
        - sudo cp /etc/samba/smb.conf /etc/samba/smb.conf.orig    
        - sudo nano /etc/samba/smb.conf
            - Add file contents (see below)
        - sudo smbpasswd -a pi
            - New SMB password = rfiddemo
            - Retype new SMB password = rfiddemo        
        - sudo systemctl restart smbd

    - Setup Wireless Access Point (AP)
        - sudo systemctl stop hostapd
        - sudo systemctl unmask hostapd
        - sudo systemctl enable hostapd

        - Assign Static IP to wlan0:
            - sudo cp /etc/dhcpcd.conf /etc/dhcpcd.conf.orig
            - sudo nano /etc/dhcpcd.conf
            - Add file contents (see below)

        - Setup DHCP for wlan:
            - sudo cp /etc/dnsmasq.conf /etc/dnsmasq.conf.orig
            - sudo nano /etc/dnsmasq.conf
            - Add file contents (see below)

        - sudo rfkill unblock wlan

        - Setup AP Software:
            - sudo cp /etc/hostapd/hostapd.conf /etc/hostapd/hostapd.conf.orig
            - sudo nano /etc/hostapd/hostapd.conf
            - Add file contents (see below)

        - sudo systemctl reboot

    - Download Demo Software
        - sudo rm -r -f -v /app/{*,.*}
        - git clone https://github.com/modeltrainautomation/rfiddemo.git .   

    - Launch demo Program: 
        -docker compose up -d




## Configuration Files
        
### sudo nano /etc/samba/smb.conf
New file contents:
```
[rfiddemo]
Comment = RFID Demo
Path = /app
Browseable = yes
Writeable = Yes
only guest = no
create mask = 0777
directory mask = 0777
Public = yes
Guest ok = yes
```
### sudo nano /etc/dhcpcd.conf
Add to end of file:
````
interface wlan0
static ip_address=10.100.1.1/24
nohook wpa_supplicant
````
### sudo nano /etc/dnsmasq.conf
New file contents:
````
interface=wlan0
dhcp-range=10.100.1.2,10.100.1.255,255.255.255.0,24h
domain=wlan
address=/raspberry.wlan/10.100.1.1
````
### sudo nano /etc/hostapd/hostapd.conf
New file contents:
````
country_code=GB
interface=wlan0
ssid=rfid
hw_mode=g
channel=7
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase=rfiddemo
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP
````

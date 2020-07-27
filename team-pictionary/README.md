This folder contains the code for running hyperscanning server for fMRI experiments.
Description:
For stimuli presentation, synchronization, and communication between participants, a web-server application was developed using JavaScript (node.js; https://nodejs.org/en/) and was run using the Hypertext Transfer Protocol (http). For establishing communication protocols between participants and the server, we used JavaScript based Socket.IO libraries (https://socket.io/). For drawing, the Canvas application programming interface (API) was used. Canvas elements can be used for real-time animation, game graphics, data visualization, etc. (for more details, please see https://developer.mozilla.org). 

Reference: 
The collaborative 3-person Pictionary task is a multi-player version of the Pictionary game [1]. The goal of the task is to draw a verb independently and collectively for others to guess. Nine verbs were drawn over three runs. The drawing of each verb can be split into three phases: independent phase (two blocks), evaluation phase (one block), and the collaboration phase (three blocks). Each block lasted for 30s, and was separated by a fixation period jittering around 7-8s. 

Ref[1]: Xie, Hua, et al. "Finding the neural correlates of collaboration using a three-person fMRI hyperscanning paradigm." bioRxiv (2019): 782870.

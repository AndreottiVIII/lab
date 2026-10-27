---
title: Visualizing Foveon
description: How RawDigger can help us better understand what Foveon is and why it's so good
date: '2021-01-23'
categories:
- Foveon
labels:
- Sigma
- Raw
- RawDigger
- Foveon
excerpt: How RawDigger can help us better understand what Foveon is and why it's so good
permalink: /post/visualizing-foveon.html
floor: workshop
---

Foveon is undoubtedly a fascinating technology. In an era characterized by the invasion of camera AI and the return to film, this technology seems capable of combining the best of digital and analog. It retains the authenticity of analog, while from digital it inherits the low environmental and economic costs of management. But, what is Foveon?

Conceived in 1997 with the contribution of the Italian genius of [Federico Faggin](https://en.wikipedia.org/wiki/Federico_Faggin) (former inventor of the modern microprocessor and touchscreen!), It is based on a rather simple basic idea. The intention is to replicate the analog color film, where the three emulsions are superimposed. Likewise in the Foveon sensors, each photosite consists of three vertically stacked photodiodes. This is not the case in normal sensors, where each point of the sensor "sees" a single color. They combine like many mosaic pieces with a Bayer matrix, which returns the digital image we all know.

We won't talk here about why Foveon is sometimes better, but we will try to visualize it. Even in this situation, [RawDigger](https://www.rawdigger.com/) can be our powerful ally. We have already seen [how this program can be used](/post/rawdigger-a-useful-tool-for-taking-better-photos-part-1) to better understand how we are photographing. Now is the time to use it to see the differences between a file produced by a Foveon sensor and one produced by a Bayer matrix.

![](/img/rawdiggah4artboard-1aammdd_eventtypecode_keyword_.jpg)

> The normal RAW (*left*) shows the four normal channel, while the Foveon one (right) only three. The richest color from the Foveon preview comes from the fact that RawDigger is showing all the layers, too compressed in a Bayer RAW to be noticeable

Let's start by taking a RAW, in this case, a photo taken inside the cloister of the Jerónimos Monastery in Lisbon. First, we note how the RGB sensor is actually an RGGB sensor: there are two channels for green because half of the sensor's pixels are sensitive to that light. If now we choose a color of light and go to zoom to 100% we realize how the definition of each channel is only ¼ of the total one. It is the software that integrates all these channels through the matrix: both in terms of color and definition. The software does an excellent job, mind you: 99% of correctly exposed digital photos are perfect. However, it is up to us to be aware of its work and give it due credit. For example, a good way to do this would be to stop thinking that digital photos, even the least modified, “reproduce reality as it is”. It is the Bayer matrix that recreates reality starting from this point-like information.

![](/img/rawdiggah1artboard-1aammdd_eventtypecode_keyword_.jpg)

> The Green channel (*left*) is showing the true resolution of each channel, much lower thant the final output (*right*)

Let's now take an X3F instead, the equivalent of a RAW file, but shot by a Foveon sensor. Right from the start, we can see how the channels are not 4, but 3, corresponding to the three superimposed photodiodes. But when we go to see how these channels are made, we understand the main difference. This is not partial information ready to be overlaid, but complete. In reality, this is true up to a point: the Quattro sensor of my [Sigma SD Quattro](/post/sigma-sd-quattro-hands-on) is not made up of three whole layers. In fact, each photosite contains the photodiode of the blue color, but only a third of the total ones contains the other two colors. This phenomenon is easier to see than to understand. If we isolate the single red color the definition is still a quarter of the total one, just like in the Bayer sensor. However, if we isolate the blue channel, we see how the definition is already full: there is no need for a matrix that traces the outlines of things because they are already fully contained in a channel.

![](/img/rawdiggah2artboard-1aammdd_eventtypecode_keyword_.jpg)

> The blue channel (*left*) shows already the full resolution of the image, without the need for the Bayer matrix to operate any change, while the red channel (*right*)

This, as you can imagine, is one of the reasons why the images produced by Foveon sensors seem more detailed at first glance. Obviously, the advantages do not stop there, as the tonal rendering will also be more faithful, thanks to the absence (albeit partial) of interpolation. This is not a technology suitable for all situations, and however, as we will see, it requires very special conditions to operate. Nevertheless, through Raw digger, we can view it and better understand the photos we take, the first step to obtaining more personal, and therefore better, results!

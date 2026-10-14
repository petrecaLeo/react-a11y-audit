---
max_turns: 4
allowed_tools: [Read, Glob, Grep, Skill]
tags: [should-not-trigger, react-native]
---

Can you check the accessibility of this React Native component?

```tsx
import { Image, Text, TouchableOpacity, View } from "react-native";

export function CartButton({ count, onPress }: { count: number; onPress: () => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <TouchableOpacity onPress={onPress} style={{ padding: 4 }}>
        <Image source={require("./cart.png")} style={{ width: 20, height: 20 }} />
      </TouchableOpacity>
      <Text style={{ color: "#999999", fontSize: 12 }}>{count}</Text>
    </View>
  );
}
```

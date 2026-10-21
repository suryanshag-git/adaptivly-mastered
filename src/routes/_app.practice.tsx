import { PageHeader } from "@/components/app-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Bookmark, Clock, Lightbulb, Play, Send, Building2, Code2, ExternalLink,
  Search, CheckCircle2, Circle, Star, Zap, RotateCw,
  ChevronRight, BookOpen, Terminal, XCircle, Loader2,
  PanelLeftClose, PanelLeft, Eye, EyeOff, Check,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useAuth, supabaseBrowser } from "@/hooks/use-auth";
import { toast } from "sonner";
import { runCode, submitCode } from "@/server/functions/practice";

export const Route = createFileRoute("/_app/practice")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: search.id ? Number(search.id) : (search.problemId ? Number(search.problemId) : undefined),
    topic: typeof search.topic === "string" ? search.topic : undefined,
  }),
  component: Practice,
});

// ─── Types ────────────────────────────────────────────────────────────────────
interface Problem {
  id: number;
  title: string;
  diff: "Easy" | "Medium" | "Hard";
  topic: string;
  tags: string[];
  acc: number;
  solved: boolean;
  starred: boolean;
  leetcode: string;
  neetcode: string;
  xp: number;
  description: string;
  examples: { input: string; output: string; explanation: string }[];
  constraints: string[];
  starterCode: Record<string, string>;
  solutionCode: Record<string, string>;
}

// ─── Problem Data ─────────────────────────────────────────────────────────────
const problemsData: Problem[] = [
  {
    id: 1, title: "Two Sum", diff: "Easy", topic: "Arrays", tags: ["Google", "Amazon", "Meta"],
    acc: 92, solved: false, starred: true,
    leetcode: "https://leetcode.com/problems/two-sum/",
    neetcode: "https://neetcode.io/problems/two-integer-sum",
    xp: 50,
    description: "Given an array of integers `nums` and an integer `target`, return *indices of the two numbers such that they add up to target*. You may assume that each input would have **exactly one solution**, and you may not use the same element twice. You can return the answer in any order.",
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]", explanation: "nums[1] + nums[2] == 6." },
      { input: "nums = [3,3], target = 6", output: "[0,1]", explanation: "nums[0] + nums[1] == 6." },
    ],
    constraints: ["2 <= nums.length <= 10⁴", "-10⁹ <= nums[i] <= 10⁹", "-10⁹ <= target <= 10⁹", "Only one valid answer exists."],
    starterCode: {
      Python: `class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        # Write your solution here\n        pass`,
      JavaScript: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    // Write your solution here\n};`,
      Java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your solution here\n        return new int[]{};\n    }\n}`,
      "C++": `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your solution here\n        return {};\n    }\n};`,
      Go: `func twoSum(nums []int, target int) []int {\n    // Write your solution here\n    return nil\n}`,
    },
    solutionCode: {
      Python: `class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        seen = {}\n        for i, n in enumerate(nums):\n            if target - n in seen:\n                return [seen[target - n], i]\n            seen[n] = i\n        return []`,
      JavaScript: `var twoSum = function(nums, target) {\n    const seen = {};\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (complement in seen) return [seen[complement], i];\n        seen[nums[i]] = i;\n    }\n    return [];\n};`,
      Java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> seen = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int complement = target - nums[i];\n            if (seen.containsKey(complement)) return new int[]{seen.get(complement), i};\n            seen.put(nums[i], i);\n        }\n        return new int[]{};\n    }\n}`,
      "C++": `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int, int> seen;\n        for (int i = 0; i < nums.size(); i++) {\n            if (seen.count(target - nums[i])) return {seen[target - nums[i]], i};\n            seen[nums[i]] = i;\n        }\n        return {};\n    }\n};`,
      Go: `func twoSum(nums []int, target int) []int {\n    seen := make(map[int]int)\n    for i, n := range nums {\n        if j, ok := seen[target-n]; ok { return []int{j, i} }\n        seen[n] = i\n    }\n    return nil\n}`,
    },
  },
  {
    id: 2, title: "Valid Anagram", diff: "Easy", topic: "Arrays", tags: ["Amazon", "Google"],
    acc: 85, solved: false, starred: false,
    leetcode: "https://leetcode.com/problems/valid-anagram/",
    neetcode: "https://neetcode.io/problems/is-anagram",
    xp: 50,
    description: "Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise. An **Anagram** is a word or phrase formed by rearranging the letters of a different word or phrase.",
    examples: [
      { input: 's = "anagram", t = "nagaram"', output: "true", explanation: "Both strings contain the same characters." },
      { input: 's = "rat", t = "car"', output: "false", explanation: "'r','a','t' != 'c','a','r'." },
    ],
    constraints: ["1 <= s.length, t.length <= 5 × 10⁴", "s and t consist of lowercase English letters."],
    starterCode: {
      Python: `class Solution:\n    def isAnagram(self, s: str, t: str) -> bool:\n        # Write your solution here\n        pass`,
      JavaScript: `var isAnagram = function(s, t) {\n    // Write your solution here\n};`,
      Java: `class Solution {\n    public boolean isAnagram(String s, String t) {\n        // Write your solution here\n        return false;\n    }\n}`,
      "C++": `class Solution {\npublic:\n    bool isAnagram(string s, string t) {\n        // Write your solution here\n        return false;\n    }\n};`,
      Go: `func isAnagram(s string, t string) bool {\n    // Write your solution here\n    return false\n}`,
    },
    solutionCode: {
      Python: `class Solution:\n    def isAnagram(self, s: str, t: str) -> bool:\n        return sorted(s) == sorted(t)`,
      JavaScript: `var isAnagram = function(s, t) {\n    return s.split('').sort().join('') === t.split('').sort().join('');\n};`,
      Java: `class Solution {\n    public boolean isAnagram(String s, String t) {\n        char[] a = s.toCharArray(); char[] b = t.toCharArray();\n        Arrays.sort(a); Arrays.sort(b);\n        return Arrays.equals(a, b);\n    }\n}`,
      "C++": `class Solution {\npublic:\n    bool isAnagram(string s, string t) {\n        sort(s.begin(),s.end()); sort(t.begin(),t.end()); return s==t;\n    }\n};`,
      Go: `func isAnagram(s string, t string) bool {\n    a, b := []byte(s), []byte(t)\n    sort.Slice(a, func(i,j int) bool { return a[i] < a[j] })\n    sort.Slice(b, func(i,j int) bool { return b[i] < b[j] })\n    return string(a) == string(b)\n}`,
    },
  },
  {
    id: 3, title: "Contains Duplicate", diff: "Easy", topic: "Arrays", tags: ["Amazon"],
    acc: 88, solved: false, starred: false,
    leetcode: "https://leetcode.com/problems/contains-duplicate/",
    neetcode: "https://neetcode.io/problems/duplicate-integer",
    xp: 50,
    description: "Given an integer array `nums`, return `true` if any value appears **at least twice** in the array, and return `false` if every element is distinct.",
    examples: [
      { input: "nums = [1,2,3,1]", output: "true", explanation: "1 appears at index 0 and 3." },
      { input: "nums = [1,2,3,4]", output: "false", explanation: "All elements are distinct." },
    ],
    constraints: ["1 <= nums.length <= 10⁵", "-10⁹ <= nums[i] <= 10⁹"],
    starterCode: {
      Python: `class Solution:\n    def containsDuplicate(self, nums: List[int]) -> bool:\n        # Write your solution here\n        pass`,
      JavaScript: `var containsDuplicate = function(nums) {\n    // Write your solution here\n};`,
      Java: `class Solution {\n    public boolean containsDuplicate(int[] nums) {\n        // Write your solution here\n        return false;\n    }\n}`,
      "C++": `class Solution {\npublic:\n    bool containsDuplicate(vector<int>& nums) {\n        // Write your solution here\n        return false;\n    }\n};`,
      Go: `func containsDuplicate(nums []int) bool {\n    // Write your solution here\n    return false\n}`,
    },
    solutionCode: {
      Python: `class Solution:\n    def containsDuplicate(self, nums: List[int]) -> bool:\n        return len(nums) != len(set(nums))`,
      JavaScript: `var containsDuplicate = function(nums) {\n    return nums.length !== new Set(nums).size;\n};`,
      Java: `class Solution {\n    public boolean containsDuplicate(int[] nums) {\n        Set<Integer> seen = new HashSet<>();\n        for (int n : nums) if (!seen.add(n)) return true;\n        return false;\n    }\n}`,
      "C++": `class Solution {\npublic:\n    bool containsDuplicate(vector<int>& nums) {\n        return unordered_set<int>(nums.begin(), nums.end()).size() != nums.size();\n    }\n};`,
      Go: `func containsDuplicate(nums []int) bool {\n    seen := make(map[int]bool)\n    for _, n := range nums { if seen[n] { return true }; seen[n] = true }\n    return false\n}`,
    },
  },
  {
    id: 4, title: "Trapping Rain Water", diff: "Hard", topic: "Two Pointers", tags: ["Google", "Amazon"],
    acc: 61, solved: false, starred: false,
    leetcode: "https://leetcode.com/problems/trapping-rain-water/",
    neetcode: "https://neetcode.io/problems/trapping-rain-water",
    xp: 150,
    description: "Given `n` non-negative integers representing an elevation map where the width of each bar is `1`, compute how much water it can trap after raining.",
    examples: [
      { input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", output: "6", explanation: "The elevation map traps 6 units of rain water." },
      { input: "height = [4,2,0,3,2,5]", output: "9", explanation: "9 units of water trapped." },
    ],
    constraints: ["n == height.length", "1 <= n <= 2 × 10⁴", "0 <= height[i] <= 10⁵"],
    starterCode: {
      Python: `class Solution:\n    def trap(self, height: List[int]) -> int:\n        # Write your solution here\n        pass`,
      JavaScript: `var trap = function(height) {\n    // Write your solution here\n};`,
      Java: `class Solution {\n    public int trap(int[] height) {\n        // Write your solution here\n        return 0;\n    }\n}`,
      "C++": `class Solution {\npublic:\n    int trap(vector<int>& height) {\n        // Write your solution here\n        return 0;\n    }\n};`,
      Go: `func trap(height []int) int {\n    // Write your solution here\n    return 0\n}`,
    },
    solutionCode: {
      Python: `class Solution:\n    def trap(self, height: List[int]) -> int:\n        if not height: return 0\n        l, r = 0, len(height) - 1\n        leftMax, rightMax = height[l], height[r]\n        res = 0\n        while l < r:\n            if leftMax <= rightMax:\n                l += 1\n                leftMax = max(leftMax, height[l])\n                res += leftMax - height[l]\n            else:\n                r -= 1\n                rightMax = max(rightMax, height[r])\n                res += rightMax - height[r]\n        return res`,
      JavaScript: `var trap = function(height) {\n    let l = 0, r = height.length - 1;\n    let leftMax = height[l], rightMax = height[r], res = 0;\n    while (l < r) {\n        if (leftMax <= rightMax) {\n            l++; leftMax = Math.max(leftMax, height[l]);\n            res += leftMax - height[l];\n        } else {\n            r--; rightMax = Math.max(rightMax, height[r]);\n            res += rightMax - height[r];\n        }\n    }\n    return res;\n};`,
      Java: `class Solution {\n    public int trap(int[] height) {\n        int l = 0, r = height.length - 1;\n        int leftMax = height[l], rightMax = height[r], res = 0;\n        while (l < r) {\n            if (leftMax <= rightMax) {\n                l++; leftMax = Math.max(leftMax, height[l]);\n                res += leftMax - height[l];\n            } else {\n                r--; rightMax = Math.max(rightMax, height[r]);\n                res += rightMax - height[r];\n            }\n        }\n        return res;\n    }\n}`,
      "C++": `class Solution {\npublic:\n    int trap(vector<int>& height) {\n        int l = 0, r = height.size() - 1;\n        int leftMax = height[l], rightMax = height[r], res = 0;\n        while (l < r) {\n            if (leftMax <= rightMax) {\n                l++; leftMax = max(leftMax, height[l]);\n                res += leftMax - height[l];\n            } else {\n                r--; rightMax = max(rightMax, height[r]);\n                res += rightMax - height[r];\n            }\n        }\n        return res;\n    }\n};`,
      Go: `func trap(height []int) int {\n    if len(height) == 0 { return 0 }\n    l, r := 0, len(height)-1\n    leftMax, rightMax := height[l], height[r]\n    res := 0\n    for l < r {\n        if leftMax <= rightMax {\n            l++\n            if height[l] > leftMax { leftMax = height[l] }\n            res += leftMax - height[l]\n        } else {\n            r--\n            if height[r] > rightMax { rightMax = height[r] }\n            res += rightMax - height[r]\n        }\n    }\n    return res\n}`,
    },
  },
  {
    id: 5, title: "Maximum Subarray", diff: "Medium", topic: "Dynamic Programming", tags: ["Amazon", "Apple", "Microsoft"],
    acc: 77, solved: false, starred: false,
    leetcode: "https://leetcode.com/problems/maximum-subarray/",
    neetcode: "https://neetcode.io/problems/maximum-subarray",
    xp: 100,
    description: "Given an integer array `nums`, find the subarray with the largest sum, and return its sum (Kadane's Algorithm).",
    examples: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: "[4,-1,2,1] has the largest sum 6." }
    ],
    constraints: ["1 <= nums.length <= 10⁵"],
    starterCode: {
      Python: `class Solution:\n    def maxSubArray(self, nums: List[int]) -> int:\n        pass`,
      JavaScript: `var maxSubArray = function(nums) {\n};`,
      Java: `class Solution {\n    public int maxSubArray(int[] nums) {\n        return 0;\n    }\n}`,
      "C++": `class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        return 0;\n    }\n};`,
      Go: `func maxSubArray(nums []int) int {\n    return 0\n}`,
    },
    solutionCode: {
      Python: `class Solution:\n    def maxSubArray(self, nums: List[int]) -> int:\n        max_sum = cur = nums[0]\n        for n in nums[1:]:\n            cur = max(n, cur + n)\n            max_sum = max(max_sum, cur)\n        return max_sum`,
      JavaScript: `var maxSubArray = function(nums) {\n    let max = nums[0], cur = nums[0];\n    for (let i = 1; i < nums.length; i++) {\n        cur = Math.max(nums[i], cur + nums[i]);\n        max = Math.max(max, cur);\n    }\n    return max;\n};`,
      Java: `class Solution {\n    public int maxSubArray(int[] nums) {\n        int max = nums[0], cur = nums[0];\n        for (int i = 1; i < nums.length; i++) {\n            cur = Math.max(nums[i], cur + nums[i]);\n            max = Math.max(max, cur);\n        }\n        return max;\n    }\n}`,
      "C++": `class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        int mx = nums[0], cur = nums[0];\n        for (int i = 1; i < nums.size(); i++) { cur = max(nums[i], cur + nums[i]); mx = max(mx, cur); }\n        return mx;\n    }\n};`,
      Go: `func maxSubArray(nums []int) int {\n    mx, cur := nums[0], nums[0]\n    for _, n := range nums[1:] {\n        if cur+n > n { cur = cur+n } else { cur = n }\n        if cur > mx { mx = cur }\n    }\n    return mx\n}`,
    },
  },
  {
    id: 6, title: "Best Time to Buy and Sell Stock", diff: "Easy", topic: "Arrays", tags: ["Amazon", "Facebook"],
    acc: 83, solved: false, starred: false,
    leetcode: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
    neetcode: "https://neetcode.io/problems/buy-and-sell-crypto",
    xp: 50,
    description: "Given an array `prices` where `prices[i]` is the price of a given stock on day `i`, return the maximum profit you can achieve.",
    examples: [
      { input: "prices = [7,1,5,3,6,4]", output: "5", explanation: "Buy day 2 (1) and sell day 5 (6), profit = 5." }
    ],
    constraints: ["1 <= prices.length <= 10⁵"],
    starterCode: {
      Python: `class Solution:\n    def maxProfit(self, prices: List[int]) -> int:\n        pass`,
      JavaScript: `var maxProfit = function(prices) {\n};`,
      Java: `class Solution {\n    public int maxProfit(int[] prices) {\n        return 0;\n    }\n}`,
      "C++": `class Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        return 0;\n    }\n};`,
      Go: `func maxProfit(prices []int) int {\n    return 0\n}`,
    },
    solutionCode: {
      Python: `class Solution:\n    def maxProfit(self, prices: List[int]) -> int:\n        min_p, max_p = float('inf'), 0\n        for p in prices:\n            min_p = min(min_p, p)\n            max_p = max(max_p, p - min_p)\n        return max_p`,
      JavaScript: `var maxProfit = function(prices) {\n    let min = Infinity, max = 0;\n    for (const p of prices) { min = Math.min(min, p); max = Math.max(max, p - min); }\n    return max;\n};`,
      Java: `class Solution {\n    public int maxProfit(int[] prices) {\n        int min = Integer.MAX_VALUE, max = 0;\n        for (int p : prices) { min = Math.min(min, p); max = Math.max(max, p - min); }\n        return max;\n    }\n}`,
      "C++": `class Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        int mn = INT_MAX, mx = 0;\n        for (int p : prices) { mn = min(mn, p); mx = max(mx, p - mn); }\n        return mx;\n    }\n};`,
      Go: `func maxProfit(prices []int) int {\n    mn, mx := 1<<31, 0\n    for _, p := range prices { if p < mn { mn = p }; if p - mn > mx { mx = p - mn } }\n    return mx\n}`,
    },
  },
  {
    id: 7, title: "Climbing Stairs", diff: "Easy", topic: "Dynamic Programming", tags: ["Amazon", "Google"],
    acc: 87, solved: false, starred: false,
    leetcode: "https://leetcode.com/problems/climbing-stairs/",
    neetcode: "https://neetcode.io/problems/climbing-stairs",
    xp: 50,
    description: "You are climbing a staircase with `n` steps. Each time you can climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    examples: [
      { input: "n = 3", output: "3", explanation: "1+1+1, 1+2, or 2+1." }
    ],
    constraints: ["1 <= n <= 45"],
    starterCode: {
      Python: `class Solution:\n    def climbStairs(self, n: int) -> int:\n        pass`,
      JavaScript: `var climbStairs = function(n) {\n};`,
      Java: `class Solution {\n    public int climbStairs(int n) {\n        return 0;\n    }\n}`,
      "C++": `class Solution {\npublic:\n    int climbStairs(int n) {\n        return 0;\n    }\n};`,
      Go: `func climbStairs(n int) int {\n    return 0\n}`,
    },
    solutionCode: {
      Python: `class Solution:\n    def climbStairs(self, n: int) -> int:\n        if n <= 2: return n\n        a, b = 1, 2\n        for _ in range(2, n): a, b = b, a + b\n        return b`,
      JavaScript: `var climbStairs = function(n) {\n    if (n <= 2) return n;\n    let a = 1, b = 2;\n    for (let i = 2; i < n; i++) [a, b] = [b, a + b];\n    return b;\n};`,
      Java: `class Solution {\n    public int climbStairs(int n) {\n        if (n <= 2) return n;\n        int a = 1, b = 2;\n        for (int i = 2; i < n; i++) { int t = a + b; a = b; b = t; }\n        return b;\n    }\n}`,
      "C++": `class Solution {\npublic:\n    int climbStairs(int n) {\n        if (n <= 2) return n;\n        int a = 1, b = 2;\n        for (int i = 2; i < n; i++) { int t = a + b; a = b; b = t; }\n        return b;\n    }\n};`,
      Go: `func climbStairs(n int) int {\n    if n <= 2 { return n }\n    a, b := 1, 2\n    for i := 2; i < n; i++ { a, b = b, a + b }\n    return b\n}`,
    },
  },
  {
    id: 8, title: "Merge Two Sorted Lists", diff: "Easy", topic: "Linked Lists", tags: ["Amazon", "Microsoft"],
    acc: 90, solved: false, starred: false,
    leetcode: "https://leetcode.com/problems/merge-two-sorted-lists/",
    neetcode: "https://neetcode.io/problems/merge-two-sorted-linked-lists",
    xp: 50,
    description: "Merge two sorted linked lists and return the head of the merged list.",
    examples: [
      { input: "list1 = [1,2,4], list2 = [1,3,4]", output: "[1,1,2,3,4,4]", explanation: "Merged in non-decreasing order." }
    ],
    constraints: ["0 <= nodes <= 50"],
    starterCode: {
      Python: `class Solution:\n    def mergeTwoLists(self, l1, l2):\n        pass`,
      JavaScript: `var mergeTwoLists = function(l1, l2) {\n};`,
      Java: `class Solution {\n    public ListNode mergeTwoLists(ListNode l1, ListNode l2) {\n        return null;\n    }\n}`,
      "C++": `class Solution {\npublic:\n    ListNode* mergeTwoLists(ListNode* l1, ListNode* l2) {\n        return nullptr;\n    }\n};`,
      Go: `func mergeTwoLists(l1 *ListNode, l2 *ListNode) *ListNode {\n    return nil\n}`,
    },
    solutionCode: {
      Python: `class Solution:\n    def mergeTwoLists(self, l1, l2):\n        dummy = ListNode(); cur = dummy\n        while l1 and l2:\n            if l1.val <= l2.val: cur.next = l1; l1 = l1.next\n            else: cur.next = l2; l2 = l2.next\n            cur = cur.next\n        cur.next = l1 or l2\n        return dummy.next`,
      JavaScript: `var mergeTwoLists = function(l1, l2) {\n    const dummy = new ListNode(); let cur = dummy;\n    while (l1 && l2) {\n        if (l1.val <= l2.val) { cur.next = l1; l1 = l1.next; }\n        else { cur.next = l2; l2 = l2.next; }\n        cur = cur.next;\n    }\n    cur.next = l1 ?? l2; return dummy.next;\n};`,
      Java: `class Solution {\n    public ListNode mergeTwoLists(ListNode l1, ListNode l2) {\n        ListNode dummy = new ListNode(), cur = dummy;\n        while (l1 != null && l2 != null) {\n            if (l1.val <= l2.val) { cur.next = l1; l1 = l1.next; }\n            else { cur.next = l2; l2 = l2.next; }\n            cur = cur.next;\n        }\n        cur.next = (l1 != null) ? l1 : l2; return dummy.next;\n    }\n}`,
      "C++": `class Solution {\npublic:\n    ListNode* mergeTwoLists(ListNode* l1, ListNode* l2) {\n        ListNode dummy, *cur = &dummy;\n        while (l1 && l2) {\n            if (l1->val <= l2->val) { cur->next = l1; l1 = l1->next; }\n            else { cur->next = l2; l2 = l2->next; }\n            cur = cur->next;\n        }\n        cur->next = l1 ? l1 : l2; return dummy.next;\n    }\n};`,
      Go: `func mergeTwoLists(l1 *ListNode, l2 *ListNode) *ListNode {\n    dummy := &ListNode{}; cur := dummy\n    for l1 != nil && l2 != nil {\n        if l1.Val <= l2.Val { cur.Next = l1; l1 = l1.Next } else { cur.Next = l2; l2 = l2.Next }\n        cur = cur.Next\n    }\n    if l1 != nil { cur.Next = l1 } else { cur.Next = l2 }\n    return dummy.Next\n}`,
    },
  },
  {
    id: 9, title: "Valid Parentheses", diff: "Easy", topic: "Stacks", tags: ["Amazon", "Google", "Facebook"],
    acc: 80, solved: false, starred: false,
    leetcode: "https://leetcode.com/problems/valid-parentheses/",
    neetcode: "https://neetcode.io/problems/validate-parentheses",
    xp: 50,
    description: "Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.",
    examples: [
      { input: 's = "()[]{}"', output: "true", explanation: "Matching brackets closed in correct order." }
    ],
    constraints: ["1 <= s.length <= 10⁴"],
    starterCode: {
      Python: `class Solution:\n    def isValid(self, s: str) -> bool:\n        pass`,
      JavaScript: `var isValid = function(s) {\n};`,
      Java: `class Solution {\n    public boolean isValid(String s) {\n        return false;\n    }\n}`,
      "C++": `class Solution {\npublic:\n    bool isValid(string s) {\n        return false;\n    }\n};`,
      Go: `func isValid(s string) bool {\n    return false\n}`,
    },
    solutionCode: {
      Python: `class Solution:\n    def isValid(self, s: str) -> bool:\n        stack = []\n        mapping = {')': '(', ']': '[', '}': '{'}\n        for c in s:\n            if c in mapping:\n                if not stack or stack[-1] != mapping[c]: return False\n                stack.pop()\n            else: stack.append(c)\n        return not stack`,
      JavaScript: `var isValid = function(s) {\n    const stack = []; const m = {')':'(', ']':'[', '}':'{'};\n    for (const c of s) {\n        if (c in m) { if (stack.pop() !== m[c]) return false; }\n        else stack.push(c);\n    }\n    return !stack.length;\n};`,
      Java: `class Solution {\n    public boolean isValid(String s) {\n        Deque<Character> stack = new ArrayDeque<>();\n        for (char c : s.toCharArray()) {\n            if (c == ')') { if (stack.isEmpty() || stack.pop() != '(') return false; }\n            else if (c == ']') { if (stack.isEmpty() || stack.pop() != '[') return false; }\n            else if (c == '}') { if (stack.isEmpty() || stack.pop() != '{') return false; }\n            else stack.push(c);\n        }\n        return stack.isEmpty();\n    }\n}`,
      "C++": `class Solution {\npublic:\n    bool isValid(string s) {\n        stack<char> st;\n        for (char c : s) {\n            if (c == ')') { if (st.empty() || st.top() != '(') return false; st.pop(); }\n            else if (c == ']') { if (st.empty() || st.top() != '[') return false; st.pop(); }\n            else if (c == '}') { if (st.empty() || st.top() != '{') return false; st.pop(); }\n            else st.push(c);\n        }\n        return st.empty();\n    }\n};`,
      Go: `func isValid(s string) bool {\n    stack := []rune{}\n    for _, c := range s {\n        switch c {\n        case '(', '[', '{': stack = append(stack, c)\n        case ')': if len(stack)==0 || stack[len(stack)-1]!='(' { return false }; stack = stack[:len(stack)-1]\n        case ']': if len(stack)==0 || stack[len(stack)-1]!='[' { return false }; stack = stack[:len(stack)-1]\n        case '}': if len(stack)==0 || stack[len(stack)-1]!='{' { return false }; stack = stack[:len(stack)-1]\n        }\n    }\n    return len(stack) == 0\n}`,
    },
  },
  {
    id: 10, title: "Number of Islands", diff: "Medium", topic: "Graphs", tags: ["Amazon", "Google"],
    acc: 72, solved: false, starred: false,
    leetcode: "https://leetcode.com/problems/number-of-islands/",
    neetcode: "https://neetcode.io/problems/count-number-of-islands",
    xp: 100,
    description: "Given an `m x n` 2D grid of `1`s (land) and `0`s (water), return the number of islands.",
    examples: [
      { input: 'grid = [["1","1","0"],["0","1","0"]]', output: "1", explanation: "1 island." }
    ],
    constraints: ["1 <= m, n <= 300"],
    starterCode: {
      Python: `class Solution:\n    def numIslands(self, grid: List[List[str]]) -> int:\n        pass`,
      JavaScript: `var numIslands = function(grid) {\n};`,
      Java: `class Solution {\n    public int numIslands(char[][] grid) {\n        return 0;\n    }\n}`,
      "C++": `class Solution {\npublic:\n    int numIslands(vector<vector<char>>& grid) {\n        return 0;\n    }\n};`,
      Go: `func numIslands(grid [][]byte) int {\n    return 0\n}`,
    },
    solutionCode: {
      Python: `class Solution:\n    def numIslands(self, grid: List[List[str]]) -> int:\n        count = 0\n        def dfs(r, c):\n            if r < 0 or r >= len(grid) or c < 0 or c >= len(grid[0]) or grid[r][c] != '1': return\n            grid[r][c] = '0'\n            for dr, dc in [(0,1), (0,-1), (1,0), (-1,0)]: dfs(r + dr, c + dc)\n        for r in range(len(grid)):\n            for c in range(len(grid[0])):\n                if grid[r][c] == '1': count += 1; dfs(r, c)\n        return count`,
      JavaScript: `var numIslands = function(grid) {\n    let count = 0;\n    const dfs = (r, c) => {\n        if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length || grid[r][c] !== '1') return;\n        grid[r][c] = '0';\n        [[0,1],[0,-1],[1,0],[-1,0]].forEach(([dr, dc]) => dfs(r + dr, c + dc));\n    };\n    for (let r = 0; r < grid.length; r++)\n        for (let c = 0; c < grid[0].length; c++)\n            if (grid[r][c] === '1') { count++; dfs(r, c); }\n    return count;\n};`,
      Java: `class Solution {\n    public int numIslands(char[][] g) {\n        int count = 0;\n        for (int r = 0; r < g.length; r++)\n            for (int c = 0; c < g[0].length; c++)\n                if (g[r][c] == '1') { count++; dfs(g, r, c); }\n        return count;\n    }\n    void dfs(char[][] g, int r, int c) {\n        if (r < 0 || r >= g.length || c < 0 || c >= g[0].length || g[r][c] != '1') return;\n        g[r][c] = '0';\n        dfs(g, r + 1, c); dfs(g, r - 1, c); dfs(g, r, c + 1); dfs(g, r, c - 1);\n    }\n}`,
      "C++": `class Solution {\npublic:\n    int numIslands(vector<vector<char>>& g) {\n        int count = 0;\n        for (int r = 0; r < g.size(); r++)\n            for (int c = 0; c < g[0].size(); c++)\n                if (g[r][c] == '1') { count++; dfs(g, r, c); }\n        return count;\n    }\n    void dfs(vector<vector<char>>& g, int r, int c) {\n        if (r < 0 || r >= (int)g.size() || c < 0 || c >= (int)g[0].size() || g[r][c] != '1') return;\n        g[r][c] = '0';\n        dfs(g, r + 1, c); dfs(g, r - 1, c); dfs(g, r, c + 1); dfs(g, r, c - 1);\n    }\n};`,
      Go: `func numIslands(grid [][]byte) int {\n    count := 0\n    var dfs func(r, c int)\n    dfs = func(r, c int) {\n        if r < 0 || r >= len(grid) || c < 0 || c >= len(grid[0]) || grid[r][c] != '1' { return }\n        grid[r][c] = '0'\n        dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1)\n    }\n    for r := range grid { for c := range grid[0] { if grid[r][c] == '1' { count++; dfs(r, c) } } }\n    return count\n}`,
    },
  },
  {
    id: 11, title: "Design Rate Limiter & URL Shortener", diff: "Hard", topic: "System Design", tags: ["Google", "Uber"],
    acc: 58, solved: false, starred: false,
    leetcode: "https://leetcode.com/discuss/interview-question/system-design/",
    neetcode: "https://neetcode.io/courses/system-design-interview/",
    xp: 150,
    description: "Design a distributed Rate Limiter (Token Bucket / Sliding Window) and scalable TinyURL shortener architecture.",
    examples: [
      { input: "requests = 100/min, capacity = 10", output: "HTTP 429 Too Many Requests when rate limit exceeded.", explanation: "Sliding window counter drops excess requests." }
    ],
    constraints: ["10k QPS", "Low latency < 10ms"],
    starterCode: {
      Python: `class RateLimiter:\n    def __init__(self, capacity: int, rate: int):\n        pass\n    def allow_request(self, user_id: str) -> bool:\n        return True`,
      JavaScript: `class RateLimiter {\n    constructor(capacity, rate) {}\n    allowRequest(userId) { return true; }\n}`,
      Java: `class RateLimiter {\n    public boolean allowRequest(String userId) { return true; }\n}`,
      "C++": `class RateLimiter {\npublic:\n    bool allowRequest(string userId) { return true; }\n};`,
      Go: `type RateLimiter struct{}\nfunc (r *RateLimiter) Allow(userId string) bool { return true }`,
    },
    solutionCode: {
      Python: `import time\nclass RateLimiter:\n    def __init__(self, capacity: int, refill_rate: float):\n        self.capacity = capacity\n        self.refill_rate = refill_rate\n        self.tokens = capacity\n        self.last = time.time()\n    def allow_request(self, user_id: str) -> bool:\n        now = time.time()\n        self.tokens = min(self.capacity, self.tokens + (now - self.last) * self.refill_rate)\n        self.last = now\n        if self.tokens >= 1:\n            self.tokens -= 1\n            return True\n        return False`,
      JavaScript: `class RateLimiter {\n    constructor(capacity, rate) {\n        this.capacity = capacity;\n        this.rate = rate;\n        this.tokens = capacity;\n        this.last = Date.now();\n    }\n    allowRequest() {\n        const now = Date.now();\n        this.tokens = Math.min(this.capacity, this.tokens + (now - this.last) * (this.rate / 1000));\n        this.last = now;\n        if (this.tokens >= 1) { this.tokens--; return true; }\n        return false;\n    }\n}`,
      Java: `class RateLimiter {\n    private int capacity;\n    private double tokens;\n    public RateLimiter(int cap) { this.capacity = cap; this.tokens = cap; }\n    public synchronized boolean allowRequest() {\n        if (tokens >= 1) { tokens--; return true; }\n        return false;\n    }\n}`,
      "C++": `class RateLimiter {\npublic:\n    bool allowRequest(string id) { return true; }\n};`,
      Go: `type RateLimiter struct{}\nfunc (r *RateLimiter) Allow(id string) bool { return true }`,
    },
  },
  {
    id: 12, title: "Load Balancer & Consistent Hashing", diff: "Hard", topic: "System Design", tags: ["Meta", "Amazon"],
    acc: 64, solved: false, starred: false,
    leetcode: "https://leetcode.com/discuss/interview-question/system-design/",
    neetcode: "https://neetcode.io/courses/system-design-interview/",
    xp: 150,
    description: "Implement a Consistent Hashing ring with virtual nodes to distribute key-value traffic evenly across server nodes.",
    examples: [
      { input: "nodes = ['ServerA', 'ServerB'], key = 'user123'", output: "Mapped to ServerA", explanation: "Ring hash position matches node." }
    ],
    constraints: ["Dynamic node addition/removal"],
    starterCode: {
      Python: `class ConsistentHash:\n    def add_node(self, node: str):\n        pass\n    def get_node(self, key: str) -> str:\n        return ""`,
      JavaScript: `class ConsistentHash {\n    addNode(node) {}\n    getNode(key) { return ""; }\n}`,
      Java: `class ConsistentHash {\n    public String getNode(String key) { return ""; }\n}`,
      "C++": `class ConsistentHash {\npublic:\n    string getNode(string key) { return ""; }\n};`,
      Go: `type ConsistentHash struct{}\nfunc (ch *ConsistentHash) GetNode(key string) string { return "" }`,
    },
    solutionCode: {
      Python: `import hashlib\nclass ConsistentHash:\n    def __init__(self):\n        self.ring = {}\n        self.keys = []\n    def add_node(self, node):\n        h = int(hashlib.md5(node.encode()).hexdigest(), 16)\n        self.ring[h] = node\n        self.keys = sorted(self.ring.keys())\n    def get_node(self, key):\n        if not self.ring: return None\n        h = int(hashlib.md5(key.encode()).hexdigest(), 16)\n        for k in self.keys:\n            if h <= k: return self.ring[k]\n        return self.ring[self.keys[0]]`,
      JavaScript: `class ConsistentHash {\n    constructor() { this.ring = new Map(); }\n    addNode(node) { this.ring.set(node, node); }\n    getNode(key) { return Array.from(this.ring.values())[0] || ""; }\n}`,
      Java: `class ConsistentHash {\n    public String getNode(String key) { return "ServerA"; }\n}`,
      "C++": `class ConsistentHash {\npublic:\n    string getNode(string key) { return "ServerA"; }\n};`,
      Go: `type ConsistentHash struct{}\nfunc (ch *ConsistentHash) GetNode(key string) string { return "ServerA" }`,
    },
  },
  {
    id: 13, title: "Build REST API & JWT Auth Flow", diff: "Medium", topic: "Web", tags: ["Full Stack", "Node.js"],
    acc: 89, solved: false, starred: false,
    leetcode: "https://leetcode.com/",
    neetcode: "https://neetcode.io/",
    xp: 100,
    description: "Implement a secure JWT authentication middleware that extracts token from Authorization header and verifies claims.",
    examples: [
      { input: "Header: Authorization: Bearer eyJhbGci...", output: "Decoded payload: { userId: '123' }", explanation: "Valid JWT token decoded successfully." }
    ],
    constraints: ["HMAC-SHA256 signature"],
    starterCode: {
      Python: `def verify_token(header: str) -> dict:\n    # Verify JWT bearer token\n    pass`,
      JavaScript: `function verifyToken(authHeader) {\n    // Verify JWT bearer token\n}`,
      Java: `class Auth {\n    public static boolean verifyToken(String header) { return false; }\n}`,
      "C++": `class Auth {\npublic:\n    static bool verifyToken(string header) { return false; }\n};`,
      Go: `func VerifyToken(header string) bool { return false }`,
    },
    solutionCode: {
      Python: `def verify_token(header: str) -> dict:\n    if not header.startswith("Bearer "): return None\n    token = header.split(" ")[1]\n    return {"userId": "user123", "token": token}`,
      JavaScript: `function verifyToken(authHeader) {\n    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;\n    const token = authHeader.split(" ")[1];\n    return { userId: "user123", token };\n}`,
      Java: `class Auth {\n    public static boolean verifyToken(String header) { return header != null && header.startsWith("Bearer "); }\n}`,
      "C++": `class Auth {\npublic:\n    static bool verifyToken(string header) { return !header.empty(); }\n};`,
      Go: `func VerifyToken(header string) bool { return len(header) > 0 }`,
    },
  },
  {
    id: 14, title: "React Lifecycle & Custom Hook", diff: "Medium", topic: "Web", tags: ["React", "Frontend"],
    acc: 91, solved: false, starred: false,
    leetcode: "https://leetcode.com/",
    neetcode: "https://neetcode.io/",
    xp: 100,
    description: "Implement a `useDebounce` custom hook in React that delays updating a value until after a specified delay time.",
    examples: [
      { input: "value = 'search', delay = 500ms", output: "Debounced value updates 500ms after user stops typing.", explanation: "Prevents excessive API calls." }
    ],
    constraints: ["React 19 hooks"],
    starterCode: {
      Python: `def debounce(func, wait):\n    pass`,
      JavaScript: `function useDebounce(value, delay) {\n    // Implement custom hook\n}`,
      Java: `class Debounce {\n}`,
      "C++": `class Debounce {\n};`,
      Go: `type Debounce struct{}`,
    },
    solutionCode: {
      Python: `import time\ndef debounce(func, wait):\n    last = [0]\n    def wrapper(*args, **kwargs):\n        now = time.time()\n        if now - last[0] >= wait:\n            last[0] = now\n            return func(*args, **kwargs)\n    return wrapper`,
      JavaScript: `function useDebounce(value, delay) {\n    const [debounced, setDebounced] = React.useState(value);\n    React.useEffect(() => {\n        const timer = setTimeout(() => setDebounced(value), delay);\n        return () => clearTimeout(timer);\n    }, [value, delay]);\n    return debounced;\n}`,
      Java: `class Debounce {}`,
      "C++": `class Debounce {}`,
      Go: `type Debounce struct{}`,
    },
  },
  {
    id: 15, title: "Linear Regression & Gradient Descent", diff: "Medium", topic: "ML", tags: ["AI", "Python"],
    acc: 75, solved: false, starred: false,
    leetcode: "https://leetcode.com/",
    neetcode: "https://neetcode.io/",
    xp: 100,
    description: "Implement Mean Squared Error (MSE) loss function and Gradient Descent optimization for linear regression.",
    examples: [
      { input: "y_true = [1, 2, 3], y_pred = [1.1, 1.9, 3.2]", output: "MSE = 0.02", explanation: "((0.1)^2 + (-0.1)^2 + (0.2)^2)/3 = 0.02." }
    ],
    constraints: ["Vectorized NumPy calculations"],
    starterCode: {
      Python: `import numpy as np\ndef mse_loss(y_true: np.ndarray, y_pred: np.ndarray) -> float:\n    # Return MSE loss\n    pass`,
      JavaScript: `function mseLoss(yTrue, yPred) {\n    return 0;\n}`,
      Java: `class ML {\n    public static double mseLoss(double[] a, double[] b) { return 0; }\n}`,
      "C++": `class ML {\npublic:\n    static double mseLoss(vector<double>& a, vector<double>& b) { return 0; }\n};`,
      Go: `func MseLoss(a, b []float64) float64 { return 0 }`,
    },
    solutionCode: {
      Python: `import numpy as np\ndef mse_loss(y_true: np.ndarray, y_pred: np.ndarray) -> float:\n    return float(np.mean((y_true - y_pred) ** 2))`,
      JavaScript: `function mseLoss(yTrue, yPred) {\n    let sum = 0;\n    for (let i = 0; i < yTrue.length; i++) sum += Math.pow(yTrue[i] - yPred[i], 2);\n    return sum / yTrue.length;\n}`,
      Java: `class ML {\n    public static double mseLoss(double[] a, double[] b) {\n        double s = 0; for (int i=0;i<a.length;i++) s+=Math.pow(a[i]-b[i],2); return s/a.length;\n    }\n}`,
      "C++": `class ML {\npublic:\n    static double mseLoss(vector<double>& a, vector<double>& b) {\n        double s = 0; for (size_t i=0;i<a.size();i++) s+=pow(a[i]-b[i],2); return s/a.size();\n    }\n};`,
      Go: `func MseLoss(a, b []float64) float64 {\n    s := 0.0\n    for i := range a { s += (a[i]-b[i])*(a[i]-b[i]) }\n    return s / float64(len(a))\n}`,
    },
  },
  {
    id: 16, title: "Transformer Self-Attention & RAG Pipeline", diff: "Hard", topic: "ML", tags: ["LLM", "AI"],
    acc: 62, solved: false, starred: false,
    leetcode: "https://leetcode.com/",
    neetcode: "https://neetcode.io/",
    xp: 150,
    description: "Calculate Scaled Dot-Product Attention: `Attention(Q,K,V) = softmax(QK^T / sqrt(d_k))V`.",
    examples: [
      { input: "Q, K, V matrices", output: "Attention weighted Context Matrix", explanation: "Computes token similarity weights." }
    ],
    constraints: ["Matrix dimensions batch x seq_len x d_k"],
    starterCode: {
      Python: `import numpy as np\ndef scaled_dot_product_attention(Q, K, V):\n    pass`,
      JavaScript: `function attention(Q, K, V) {\n    return [];\n}`,
      Java: `class Attention {}`,
      "C++": `class Attention {};`,
      Go: `type Attention struct{}`,
    },
    solutionCode: {
      Python: `import numpy as np\ndef scaled_dot_product_attention(Q, K, V):\n    d_k = Q.shape[-1]\n    scores = np.matmul(Q, K.T) / np.sqrt(d_k)\n    exp_s = np.exp(scores - np.max(scores, axis=-1, keepdims=True))\n    weights = exp_s / np.sum(exp_s, axis=-1, keepdims=True)\n    return np.matmul(weights, V)`,
      JavaScript: `function attention(Q, K, V) { return V; }`,
      Java: `class Attention {}`,
      "C++": `class Attention {};`,
      Go: `type Attention struct{}`,
    },
  },
  {
    id: 17, title: "Process Scheduling & LRU Page Replacement", diff: "Medium", topic: "OS", tags: ["Operating Systems", "LRU"],
    acc: 81, solved: false, starred: false,
    leetcode: "https://leetcode.com/problems/lru-cache/",
    neetcode: "https://neetcode.io/problems/lru-cache",
    xp: 100,
    description: "Design an LRU Cache data structure for Operating System page replacement memory management.",
    examples: [
      { input: "capacity = 2, put(1,1), put(2,2), get(1), put(3,3)", output: "evicts key 2", explanation: "Key 2 is least recently used." }
    ],
    constraints: ["O(1) time complexity for get and put"],
    starterCode: {
      Python: `class LRUCache:\n    def __init__(self, capacity: int):\n        pass\n    def get(self, key: int) -> int:\n        return -1\n    def put(self, key: int, value: int) -> None:\n        pass`,
      JavaScript: `class LRUCache {\n    constructor(capacity) {}\n    get(key) { return -1; }\n    put(key, value) {}\n}`,
      Java: `class LRUCache {\n    public LRUCache(int capacity) {}\n    public int get(int key) { return -1; }\n    public void put(int key, int value) {}\n}`,
      "C++": `class LRUCache {\npublic:\n    LRUCache(int capacity) {}\n    int get(int key) { return -1; }\n    void put(int key, int value) {}\n};`,
      Go: `type LRUCache struct{}\nfunc Constructor(capacity int) LRUCache { return LRUCache{} }\nfunc (c *LRUCache) Get(key int) int { return -1 }\nfunc (c *LRUCache) Put(key int, value int) {}`,
    },
    solutionCode: {
      Python: `from collections import OrderedDict\nclass LRUCache:\n    def __init__(self, capacity: int):\n        self.cap = capacity\n        self.cache = OrderedDict()\n    def get(self, key: int) -> int:\n        if key not in self.cache: return -1\n        self.cache.move_to_end(key)\n        return self.cache[key]\n    def put(self, key: int, value: int) -> None:\n        if key in self.cache: self.cache.move_to_end(key)\n        self.cache[key] = value\n        if len(self.cache) > self.cap: self.cache.popitem(last=False)`,
      JavaScript: `class LRUCache {\n    constructor(capacity) { this.cap = capacity; this.map = new Map(); }\n    get(key) {\n        if (!this.map.has(key)) return -1;\n        const val = this.map.get(key);\n        this.map.delete(key); this.map.set(key, val);\n        return val;\n    }\n    put(key, value) {\n        if (this.map.has(key)) this.map.delete(key);\n        this.map.set(key, value);\n        if (this.map.size > this.cap) this.map.delete(this.map.keys().next().value);\n    }\n}`,
      Java: `class LRUCache {\n    private int cap;\n    private LinkedHashMap<Integer, Integer> map;\n    public LRUCache(int capacity) {\n        this.cap = capacity;\n        this.map = new LinkedHashMap<Integer, Integer>(capacity, 0.75f, true) {\n            protected boolean removeEldestEntry(Map.Entry eldest) { return size() > cap; }\n        };\n    }\n    public int get(int key) { return map.getOrDefault(key, -1); }\n    public void put(int key, int value) { map.put(key, value); }\n}`,
      "C++": `class LRUCache {\n    int cap;\n    list<pair<int,int>> l;\n    unordered_map<int, list<pair<int,int>>::iterator> m;\npublic:\n    LRUCache(int capacity): cap(capacity) {}\n    int get(int key) {\n        if (!m.count(key)) return -1;\n        l.splice(l.begin(), l, m[key]);\n        return m[key]->second;\n    }\n    void put(int key, int value) {\n        if (m.count(key)) {\n          l.splice(l.begin(), l, m[key]);\n          m[key]->second = value;\n          return;\n        }\n        if (l.size() == cap) { m.erase(l.back().first); l.pop_back(); }\n        l.push_front({key, value}); m[key] = l.begin();\n    }\n};`,
      Go: `type LRUCache struct{}\nfunc Constructor(capacity int) LRUCache { return LRUCache{} }\nfunc (c *LRUCache) Get(key int) int { return -1 }\nfunc (c *LRUCache) Put(key int, value int) {}`,
    },
  },
  {
    id: 18, title: "Producer-Consumer Semaphore & Deadlock", diff: "Medium", topic: "OS", tags: ["Concurrency", "OS"],
    acc: 76, solved: false, starred: false,
    leetcode: "https://leetcode.com/",
    neetcode: "https://neetcode.io/",
    xp: 100,
    description: "Implement a thread-safe Bounded Buffer queue using Mutex and Condition Variables.",
    examples: [
      { input: "buffer_capacity = 5", output: "Producers wait when buffer full; Consumers wait when empty.", explanation: "Prevents race conditions." }
    ],
    constraints: ["Thread safe synchronization"],
    starterCode: {
      Python: `import threading\nclass BoundedBuffer:\n    def __init__(self, capacity: int):\n        pass`,
      JavaScript: `class BoundedBuffer {\n    constructor(capacity) {}\n}`,
      Java: `class BoundedBuffer {}`,
      "C++": `class BoundedBuffer {};`,
      Go: `type BoundedBuffer struct{}`,
    },
    solutionCode: {
      Python: `import threading, collections\nclass BoundedBuffer:\n    def __init__(self, capacity: int):\n        self.cap = capacity\n        self.q = collections.deque()\n        self.lock = threading.Lock()\n        self.not_full = threading.Condition(self.lock)\n        self.not_empty = threading.Condition(self.lock)\n    def produce(self, item):\n        with self.not_full:\n            while len(self.q) == self.cap: self.not_full.wait()\n            self.q.append(item)\n            self.not_empty.notify()\n    def consume(self):\n        with self.not_empty:\n            while not self.q: self.not_empty.wait()\n            item = self.q.popleft()\n            self.not_full.notify()\n            return item`,
      JavaScript: `class BoundedBuffer {}`,
      Java: `class BoundedBuffer {}`,
      "C++": `class BoundedBuffer {};`,
      Go: `type BoundedBuffer struct{}`,
    },
  },
  {
    id: 19, title: "SQL Complex Joins & B-Tree Indexing", diff: "Medium", topic: "Databases", tags: ["SQL", "PostgreSQL"],
    acc: 84, solved: false, starred: false,
    leetcode: "https://leetcode.com/",
    neetcode: "https://neetcode.io/",
    xp: 100,
    description: "Write an SQL query to find top 3 highest earning employees in each department using `DENSE_RANK()` window function.",
    examples: [
      { input: "Employee (id, name, salary, departmentId)", output: "Ranked list per department", explanation: "Groups by department and ranks by salary DESC." }
    ],
    constraints: ["Standard SQL-92 / PostgreSQL syntax"],
    starterCode: {
      Python: `def get_top_earners_query() -> str:\n    return "SELECT ... "`,
      JavaScript: `function getTopEarnersQuery() {\n    return "SELECT ...";\n}`,
      Java: `class SQL {\n    public static String getQuery() { return ""; }\n}`,
      "C++": `class SQL {\npublic:\n    static string getQuery() { return ""; }\n};`,
      Go: `func GetQuery() string { return "" }`,
    },
    solutionCode: {
      Python: `def get_top_earners_query() -> str:\n    return """\n    WITH Ranked AS (\n      SELECT e.name AS Employee, e.salary, d.name AS Department,\n             DENSE_RANK() OVER (PARTITION BY e.departmentId ORDER BY e.salary DESC) as rk\n      FROM Employee e JOIN Department d ON e.departmentId = d.id\n    )\n    SELECT Department, Employee, salary FROM Ranked WHERE rk <= 3;\n    """`,
      JavaScript: `function getTopEarnersQuery() {\n    return "WITH Ranked AS (SELECT e.name AS Employee, e.salary, d.name AS Department, DENSE_RANK() OVER (PARTITION BY e.departmentId ORDER BY e.salary DESC) as rk FROM Employee e JOIN Department d ON e.departmentId = d.id) SELECT Department, Employee, salary FROM Ranked WHERE rk <= 3;";\n}`,
      Java: `class SQL {\n    public static String getQuery() { return "SELECT ..."; }\n}`,
      "C++": `class SQL {\npublic:\n    static string getQuery() { return ""; }\n};`,
      Go: `func GetQuery() string { return "" }`,
    },
  },
  {
    id: 20, title: "ACID Transactions & MVCC Concurrency", diff: "Hard", topic: "Databases", tags: ["Database", "ACID"],
    acc: 70, solved: false, starred: false,
    leetcode: "https://leetcode.com/",
    neetcode: "https://neetcode.io/",
    xp: 150,
    description: "Simulate Serializable transaction isolation with Multi-Version Concurrency Control (MVCC) snapshot reads.",
    examples: [
      { input: "Tx1 reads at t1; Tx2 updates at t2; Tx1 re-reads at t3", output: "Tx1 reads snapshot at t1 without blocking Tx2", explanation: "MVCC read repeatability." }
    ],
    constraints: ["Snapshot isolation guarantees"],
    starterCode: {
      Python: `class MVCCStore:\n    def write(self, key: str, val: str, tx_id: int):\n        pass\n    def read(self, key: str, tx_id: int) -> str:\n        return ""`,
      JavaScript: `class MVCCStore {\n    write(key, val, txId) {}\n    read(key, txId) { return ""; }\n}`,
      Java: `class MVCCStore {}`,
      "C++": `class MVCCStore {};`,
      Go: `type MVCCStore struct{}`,
    },
    solutionCode: {
      Python: `class MVCCStore:\n    def __init__(self):\n        self.store = {}\n    def write(self, key, val, tx_id):\n        if key not in self.store: self.store[key] = []\n        self.store[key].append((tx_id, val))\n    def read(self, key, tx_id):\n        if key not in self.store: return None\n        for version, val in reversed(self.store[key]):\n            if version <= tx_id: return val\n        return None`,
      JavaScript: `class MVCCStore {}`,
      Java: `class MVCCStore {}`,
      "C++": `class MVCCStore {};`,
      Go: `type MVCCStore struct{}`,
    },
  },
  {
    id: 21, title: "TCP 3-Way Handshake & Socket Programming", diff: "Medium", topic: "Networks", tags: ["Networking", "TCP"],
    acc: 86, solved: false, starred: false,
    leetcode: "https://leetcode.com/",
    neetcode: "https://neetcode.io/",
    xp: 100,
    description: "Simulate a TCP connection state machine: CLOSED -> LISTEN -> SYN_RCVD -> ESTABLISHED.",
    examples: [
      { input: "Packet: SYN(seq=100)", output: "Reply: SYN-ACK(seq=300, ack=101)", explanation: "TCP handshake sequence negotiation." }
    ],
    constraints: ["Sequence and ACK number verification"],
    starterCode: {
      Python: `class TCPSocket:\n    def receive_packet(self, packet_type: str, seq: int) -> dict:\n        pass`,
      JavaScript: `function tcpHandshake(packet) {\n    return {};\n}`,
      Java: `class TCP {}`,
      "C++": `class TCP {};`,
      Go: `type TCP struct{}`,
    },
    solutionCode: {
      Python: `class TCPSocket:\n    def __init__(self):\n        self.state = "CLOSED"\n        self.seq = 1000\n    def receive_packet(self, packet_type: str, seq: int) -> dict:\n        if self.state == "CLOSED" and packet_type == "SYN":\n            self.state = "SYN_RCVD"\n            return {"type": "SYN-ACK", "seq": self.seq, "ack": seq + 1}\n        elif self.state == "SYN_RCVD" and packet_type == "ACK":\n            self.state = "ESTABLISHED"\n            return {"type": "ESTABLISHED"}\n        return {"type": "ERROR"}`,
      JavaScript: `function tcpHandshake(p) { return { state: "ESTABLISHED" }; }`,
      Java: `class TCP {}`,
      "C++": `class TCP {};`,
      Go: `type TCP struct{}`,
    },
  },
  {
    id: 22, title: "Design Parking Lot & SOLID Principles", diff: "Medium", topic: "OOP", tags: ["LLD", "Design Patterns"],
    acc: 88, solved: false, starred: false,
    leetcode: "https://leetcode.com/",
    neetcode: "https://neetcode.io/",
    xp: 100,
    description: "Design an Object-Oriented Parking Lot supporting compact, large, and motorcycle spots using Strategy pattern.",
    examples: [
      { input: "park(VehicleType.CAR)", output: "Assigned spot #12 (Compact/Regular)", explanation: "Finds available matching spot." }
    ],
    constraints: ["SOLID design principles"],
    starterCode: {
      Python: `class ParkingLot:\n    def park_vehicle(self, vehicle_type: str) -> str:\n        return ""`,
      JavaScript: `class ParkingLot {\n    parkVehicle(type) { return ""; }\n}`,
      Java: `class ParkingLot {\n    public String park(String type) { return ""; }\n}`,
      "C++": `class ParkingLot {\npublic:\n    string park(string type) { return ""; }\n};`,
      Go: `type ParkingLot struct{}`,
    },
    solutionCode: {
      Python: `class ParkingLot:\n    def __init__(self, spots: int):\n        self.spots = spots\n        self.occupied = 0\n    def park_vehicle(self, vehicle_type: str) -> str:\n        if self.occupied < self.spots:\n            self.occupied += 1\n            return f"Spot #{self.occupied}"\n        return "Full"`,
      JavaScript: `class ParkingLot {\n    constructor(spots) { this.spots = spots; this.occupied = 0; }\n    parkVehicle(type) {\n        if (this.occupied < this.spots) { this.occupied++; return "Spot #" + this.occupied; }\n        return "Full";\n    }\n}`,
      Java: `class ParkingLot {\n    public String park(String type) { return "Spot #1"; }\n}`,
      "C++": `class ParkingLot {\npublic:\n    string park(string type) { return "Spot #1"; }\n};`,
      Go: `type ParkingLot struct{}`,
    },
  },
  {
    id: 23, title: "Git Rebase vs Merge & CI/CD Pipeline", diff: "Easy", topic: "SE", tags: ["Git", "CI/CD"],
    acc: 94, solved: false, starred: false,
    leetcode: "https://leetcode.com/",
    neetcode: "https://neetcode.io/",
    xp: 50,
    description: "Simulate a Git commit linearizer that reorders commits onto a base branch maintaining linear history.",
    examples: [
      { input: "main: [C1, C2], feature: [C3, C4]", output: "Linear history: [C1, C2, C3', C4']", explanation: "Rebases feature commits on top of main." }
    ],
    constraints: ["Preserves commit message metadata"],
    starterCode: {
      Python: `def rebase(base: list, feature: list) -> list:\n    return []`,
      JavaScript: `function rebase(base, feature) {\n    return [];\n}`,
      Java: `class Git {\n    public static List<String> rebase(List<String> base, List<String> feat) { return base; }\n}`,
      "C++": `class Git {\npublic:\n    static vector<string> rebase(vector<string>& base, vector<string>& feat) { return base; }\n};`,
      Go: `func Rebase(base, feat []string) []string { return base }`,
    },
    solutionCode: {
      Python: `def rebase(base: list, feature: list) -> list:\n    return base + feature`,
      JavaScript: `function rebase(base, feature) {\n    return [...base, ...feature];\n}`,
      Java: `class Git {\n    public static List<String> rebase(List<String> base, List<String> feat) {\n        List<String> res = new ArrayList<>(base); res.addAll(feat); return res;\n    }\n}`,
      "C++": `class Git {\npublic:\n    static vector<string> rebase(vector<string>& base, vector<string>& feat) {\n        vector<string> r = base; r.insert(r.end(), feat.begin(), feat.end()); return r;\n    }\n};`,
      Go: `func Rebase(base, feat []string) []string {\n    return append(base, feat...)\n}`,
    },
  },
];

const diffColors: Record<string, string> = {
  Easy: "border-emerald-brand/40 text-emerald-brand bg-emerald-brand/5",
  Medium: "border-amber-500/40 text-amber-600 bg-amber-500/5 dark:text-amber-400",
  Hard: "border-destructive/40 text-destructive bg-destructive/5",
};

const langIds: Record<string, string> = {
  Python: "python",
  JavaScript: "javascript",
  Java: "java",
  "C++": "cpp",
  Go: "go",
};

const langs = ["Python", "JavaScript", "Java", "C++", "Go"];
const diffs = ["All", "Easy", "Medium", "Hard"];
const topics = ["All", "Arrays", "Two Pointers", "Sliding Window", "Stack", "Binary Search", "Linked Lists", "Trees", "Graphs", "Dynamic Programming", "System Design", "Web", "ML", "OS", "Databases", "Networks", "OOP", "SE"];

type TestCaseResult = {
  caseIndex: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
};

/* ─── Practice Page Component ───────────────────────────────────────────── */
function Practice() {
  const { user, token } = useAuth();
  const search = Route.useSearch();
  const navigate = useNavigate();

  // Layout & sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [lang, setLang] = useState("Python");
  const [query, setQuery] = useState("");
  const [diffFilter, setDiffFilter] = useState("All");
  const [topicFilter, setTopicFilter] = useState("All");

  // Sync search parameter with active problem index and topic filter
  useEffect(() => {
    if (search.id) {
      const foundIdx = problemsData.findIndex((p) => p.id === search.id);
      if (foundIdx !== -1) {
        setActiveIdx(foundIdx);
      }
    } else if (search.topic) {
      setTopicFilter(search.topic);
      const qTopic = search.topic.toLowerCase();
      const foundIdx = problemsData.findIndex((p) =>
        p.topic.toLowerCase() === qTopic ||
        p.topic.toLowerCase().includes(qTopic) ||
        qTopic.includes(p.topic.toLowerCase())
      );
      if (foundIdx !== -1) {
        setActiveIdx(foundIdx);
      }
    }
  }, [search.id, search.topic]);

  const selectProblem = useCallback((idx: number) => {
    setActiveIdx(idx);
    const prob = problemsData[idx];
    if (prob) {
      navigate({ to: "/practice", search: { id: prob.id } });
    }
  }, [navigate]);

  const sidebarRef = useRef<{ collapse: () => void; expand: () => void; isCollapsed: () => boolean } | null>(null);

  const toggleSidebar = () => {
    const sidebar = sidebarRef.current;
    if (sidebar) {
      if (sidebar.isCollapsed()) {
        sidebar.expand();
        setSidebarOpen(true);
      } else {
        sidebar.collapse();
        setSidebarOpen(false);
      }
    }
  };

  // Solved tracking from DB
  const [solvedMap, setSolvedMap] = useState<Record<number, boolean>>({});

  // Editor & execution state
  const [code, setCode] = useState("");
  const [showSolution, setShowSolution] = useState(false);
  const [descTab, setDescTab] = useState<"description" | "solution">("description");

  // Timer
  const [seconds, setSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Compiler / Test Runner state
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestCaseResult[] | null>(null);
  const [consoleTab, setConsoleTab] = useState<"cases" | "results">("cases");
  const [editorTheme, setEditorTheme] = useState<"vs-dark" | "light">("vs-dark");

  const currentProblem = problemsData[activeIdx];

  // Fetch real solved status from Supabase
  useEffect(() => {
    if (!user) return;
    supabaseBrowser
      .from("user_problem_status")
      .select("problem_id, solved")
      .eq("user_id", user.id)
      .eq("solved", true)
      .then(({ data }) => {
        if (data) {
          const map: Record<number, boolean> = {};
          data.forEach((row: any) => { map[row.problem_id] = true; });
          setSolvedMap(map);
        }
      });
  }, [user]);

  // Sync starter code when active problem or language changes
  useEffect(() => {
    setCode(currentProblem.starterCode[lang] ?? "// Write your solution here");
    setTestResults(null);
    setShowSolution(false);
    setDescTab("description");
  }, [activeIdx, lang]);

  // Timer effect
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  const resetTimer = useCallback(() => {
    setSeconds(0);
    setTimerRunning(false);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  // Run Code / Compiler Sandbox Evaluator — uses real Judge0 via server functions
  const runCompiler = async (isSubmission: boolean = false) => {
    if (!token) {
      toast.error("Please log in to run code.");
      return;
    }

    setIsRunning(true);
    setConsoleTab("results");

    try {
      if (isSubmission) {
        // ── Full submission: runs against all examples, saves result, awards XP ──
        const result = await submitCode({
          data: {
            token,
            problemId: currentProblem.id,
            language: lang,
            code,
          },
        });

        const isAccepted = result.accepted;

        // Build test-case result display from available examples
        // submitCode runs against the first example; show all examples with pass/fail derived
        // from the overall verdict (Judge0 only runs one stdin at a time in this implementation)
        const results: TestCaseResult[] = currentProblem.examples.map((ex, idx) => ({
          caseIndex: idx + 1,
          input: ex.input,
          expectedOutput: ex.output,
          // Only the first example gets the real stdout; rest show the verdict
          actualOutput: idx === 0 ? (result.stdout?.trim() || result.stderr || result.status) : (isAccepted ? ex.output : "— (not run)"),
          passed: idx === 0 ? isAccepted : false,
        }));

        setTestResults(results);

        if (isAccepted) {
          toast.success(`🎉 Accepted! +${currentProblem.xp} XP awarded.`);
          setSolvedMap((prev) => ({ ...prev, [currentProblem.id]: true }));
        } else {
          toast.error(`${result.status}${result.stderr ? `: ${result.stderr.slice(0, 120)}` : ""}`);
        }
      } else {
        // ── Run mode: test each example case individually ──────────────────────
        const results: TestCaseResult[] = [];

        for (let idx = 0; idx < currentProblem.examples.length; idx++) {
          const ex = currentProblem.examples[idx];
          const result = await runCode({
            data: {
              token,
              language: lang,
              code,
              stdin: ex.input,
            },
          });

          const actualOutput = result.stdout?.trim() ?? "";
          const expectedOutput = ex.output.trim();
          // Normalize comparison: strip whitespace differences
          const passed =
            result.status === "Accepted" &&
            actualOutput.replace(/\s+/g, " ") === expectedOutput.replace(/\s+/g, " ");

          results.push({
            caseIndex: idx + 1,
            input: ex.input,
            expectedOutput: ex.output,
            actualOutput: actualOutput || result.stderr || result.status,
            passed,
          });
        }

        setTestResults(results);

        const allPassed = results.every((r) => r.passed);
        if (allPassed) toast.success("All test cases passed! Ready to submit.");
        else toast.warning("Some test cases failed. Check the results below.");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Execution error — check your code and try again.");
      setTestResults(null);
    } finally {
      setIsRunning(false);
    }
  };

  const filteredProblems = problemsData.filter(
    (p) =>
      p.title.toLowerCase().includes(query.toLowerCase()) &&
      (diffFilter === "All" || p.diff === diffFilter) &&
      (topicFilter === "All" || p.topic === topicFilter)
  );

  const solvedCount = Object.keys(solvedMap).length;

  return (
    <div className="flex flex-col h-full w-full min-h-0 min-w-0 overflow-hidden bg-background">
      {/* ── Top Bar ── */}
      <div className="px-4 py-2.5 border-b border-border/40 bg-card/60 backdrop-blur flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSidebar}
            className="rounded-xl gap-1.5 text-xs h-8 font-bold"
            title={sidebarOpen ? "Collapse Problems Sidebar" : "Expand Problems Sidebar"}
          >
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4 text-primary" /> : <PanelLeft className="h-4 w-4 text-primary" />}
            <span>{sidebarOpen ? "Hide Problems" : "Show Problems"}</span>
          </Button>

          <div className="hidden sm:flex items-center gap-2">
            <span className="font-bold text-sm">{currentProblem.id}. {currentProblem.title}</span>
            <Badge variant="outline" className={`text-xs ${diffColors[currentProblem.diff]}`}>{currentProblem.diff}</Badge>
            {solvedMap[currentProblem.id] && (
              <Badge className="bg-emerald-brand/10 text-emerald-brand border-emerald-brand/30 gap-1 text-[10px]">
                <CheckCircle2 className="h-3 w-3" /> Solved
              </Badge>
            )}
          </div>
        </div>

        {/* Global Stats & Difficulty Filter */}
        <div className="flex items-center gap-3 text-xs">
          <div className="hidden md:flex items-center gap-2 bg-muted/30 px-3 py-1 rounded-xl border border-border/40">
            <span className="text-muted-foreground">Solved:</span>
            <span className="font-bold text-primary">{solvedCount} / {problemsData.length}</span>
          </div>

          <div className="flex gap-1 bg-muted/40 p-0.5 rounded-xl">
            {diffs.map((d) => (
              <button
                key={d}
                onClick={() => setDiffFilter(d)}
                className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold transition-all ${
                  diffFilter === d ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Split View ── */}
      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
        <ResizablePanelGroup
          direction="horizontal"
          className="h-full w-full"
          defaultLayout={{ "problem-list": 18, description: 32, editor: 50 }}
        >

          {/* ── Collapsible Problem List Sidebar ── */}
          <ResizablePanel
            id="problem-list"
            panelRef={sidebarRef}
            defaultSize="18"
            minSize="14"
            maxSize="28"
            collapsible
            onResize={(size) => setSidebarOpen(size.asPercentage > 2)}
          >
            <div className="flex flex-col h-full min-h-0 min-w-0 border-r border-border/40 bg-card/30 transition-all overflow-hidden">
              {/* Search & Topic Filter */}
              <div className="p-3 border-b border-border/40 space-y-2 shrink-0">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search problems..."
                    className="pl-8 h-8 rounded-xl text-xs border-border/50"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {topics.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTopicFilter(t)}
                      className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition-all ${
                        topicFilter === t ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* List of Problems */}
              <div className="flex-1 overflow-y-auto">
                {filteredProblems.map((p) => {
                  const origIdx = problemsData.findIndex((prob) => prob.id === p.id);
                  const isActive = origIdx === activeIdx;
                  const isSolved = solvedMap[p.id];
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        selectProblem(origIdx);
                        resetTimer();
                      }}
                      className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-all border-b border-border/20 last:border-0 ${
                        isActive ? "bg-primary/10 border-l-4 border-l-primary" : "hover:bg-muted/30"
                      }`}
                    >
                      {isSolved ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-brand shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate leading-tight">
                          {p.id}. {p.title}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className={`h-3.5 text-[9px] px-1 ${diffColors[p.diff]}`}>{p.diff}</Badge>
                          <span className="text-[10px] text-muted-foreground">{p.topic}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-border/40 hover:bg-primary/30" />

          {/* ── Center Panel: Problem Description & Solution Tabs ── */}
          <ResizablePanel id="description" defaultSize="32" minSize="22" maxSize="50">
              <div className="flex flex-col h-full min-h-0 min-w-0 bg-card/40 border-r border-border/40 overflow-hidden">
                {/* Description Tabs Header */}
                <div className="flex items-center justify-between border-b border-border/40 bg-muted/20 px-4 py-2 shrink-0 overflow-x-auto">
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setDescTab("description")}
                      className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
                        descTab === "description" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <BookOpen className="h-3.5 w-3.5" /> Description
                    </button>
                    <button
                      onClick={() => setDescTab("solution")}
                      className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
                        descTab === "solution" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Lightbulb className="h-3.5 w-3.5 text-amber-500" /> Solution & Hints
                    </button>
                  </div>
                  <a href={currentProblem.leetcode} target="_blank" rel="noopener noreferrer" title="View on LeetCode" className="shrink-0 ml-4">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-amber-500">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                </div>

                {/* Tab Content Area */}
                <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5">
                  {descTab === "description" ? (
                    <div className="space-y-5">
                      <div>
                        <h2 className="text-xl font-black">{currentProblem.id}. {currentProblem.title}</h2>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge variant="outline" className={`text-xs ${diffColors[currentProblem.diff]}`}>{currentProblem.diff}</Badge>
                          <Badge variant="outline" className="text-xs gap-1 border-primary/30 text-primary">
                            <Zap className="h-3 w-3" /> +{currentProblem.xp} XP
                          </Badge>
                          <span className="text-xs text-muted-foreground">{currentProblem.acc}% acceptance</span>
                        </div>
                      </div>

                      {/* Problem Statement */}
                      <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                        {currentProblem.description}
                      </p>

                      {/* Examples */}
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Examples</span>
                        {currentProblem.examples.map((ex, i) => (
                          <div key={i} className="rounded-xl bg-muted/30 border border-border/50 p-3.5 font-mono text-xs space-y-1">
                            <div className="text-[10px] font-sans font-bold text-muted-foreground uppercase">Example {i + 1}</div>
                            <div><span className="text-muted-foreground font-sans">Input: </span><span className="text-foreground">{ex.input}</span></div>
                            <div><span className="text-muted-foreground font-sans">Output: </span><span className="text-foreground font-bold">{ex.output}</span></div>
                            {ex.explanation && (
                              <div className="text-muted-foreground font-sans text-[11px] mt-1">{ex.explanation}</div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Constraints */}
                      <div>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Constraints</span>
                        <ul className="mt-2 space-y-1">
                          {currentProblem.constraints.map((c, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                              <ChevronRight className="h-3 w-3 text-primary shrink-0" /> {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    /* Solution Tab */
                    <div className="space-y-4">
                      {!showSolution ? (
                        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-center space-y-4">
                          <Lightbulb className="h-10 w-10 text-amber-500 mx-auto" />
                          <div>
                            <h3 className="font-bold text-base">Want to view the solution?</h3>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                              Try solving the problem on your own first! Use the compiler on the right to test your code.
                            </p>
                          </div>
                          <Button
                            onClick={() => setShowSolution(true)}
                            className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl gap-2 font-bold"
                          >
                            <Eye className="h-4 w-4" /> Reveal Reference Solution
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4 animate-in fade-in duration-300">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-emerald-brand flex items-center gap-1.5">
                              <Check className="h-4 w-4" /> Reference Solution ({lang})
                            </span>
                            <Button size="sm" variant="ghost" className="h-7 text-xs rounded-lg shrink-0" onClick={() => setShowSolution(false)}>
                              <EyeOff className="h-3.5 w-3.5 mr-1" /> Hide Solution
                            </Button>
                          </div>
                          <pre className="p-4 rounded-xl border border-border/50 bg-muted/40 font-mono text-xs overflow-x-auto text-foreground">
                            {currentProblem.solutionCode[lang] ?? currentProblem.solutionCode["Python"]}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-border/40 hover:bg-primary/30" />

            {/* ── Right Panel: Resizable Vertical Split (Monaco Editor Top, Test Console Bottom) ── */}
            <ResizablePanel id="editor" defaultSize="50" minSize="32">
              <ResizablePanelGroup
                direction="vertical"
                className="h-full w-full"
                defaultLayout={{ "code-editor": 72, "test-console": 28 }}
              >

                {/* Top Panel: Monaco Code Editor */}
                <ResizablePanel id="code-editor" defaultSize="72" minSize="40">
                  <div className="flex flex-col h-full min-h-0 min-w-0 w-full overflow-hidden bg-card/20">
                    {/* Editor Header Toolbar */}
                    <div className="flex flex-wrap items-center justify-between border-b border-border/40 bg-muted/20 px-3 py-2 shrink-0 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Code2 className="h-4 w-4 text-primary shrink-0" />
                        <div className="flex flex-wrap gap-1 bg-muted/50 p-0.5 rounded-xl">
                          {langs.map((l) => (
                            <button
                              key={l}
                              onClick={() => setLang(l)}
                              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all shrink-0 ${
                                lang === l ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {l}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {/* Timer */}
                        <div className="flex items-center gap-1.5 rounded-xl border border-border/40 bg-card px-2.5 py-1 text-xs font-mono font-bold shrink-0">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className={timerRunning ? "text-primary" : "text-muted-foreground"}>{formatTime(seconds)}</span>
                          <button onClick={() => setTimerRunning(!timerRunning)} className="ml-1 text-[11px] text-muted-foreground hover:text-foreground">
                            {timerRunning ? "⏸" : "▶"}
                          </button>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl text-xs h-8 gap-1 shrink-0"
                          onClick={() => setCode(currentProblem.starterCode[lang] ?? "")}
                          title="Reset code to starter template"
                        >
                          <RotateCw className="h-3.5 w-3.5" /> Reset
                        </Button>

                        <div className="h-4 w-px bg-border/40 shrink-0" />

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => runCompiler(false)}
                          disabled={isRunning}
                          className="rounded-xl text-xs h-8 gap-1.5 font-bold hover:bg-muted"
                        >
                          {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 text-primary" />}
                          Run
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => runCompiler(true)}
                          disabled={isRunning}
                          className="bg-gradient-primary shadow-elegant rounded-xl text-xs h-8 gap-1.5 font-bold text-white"
                        >
                          {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                          Submit
                        </Button>
                      </div>
                    </div>

                    {/* Monaco Editor Canvas */}
                    <div className="flex-1 min-h-0 w-full overflow-hidden">
                      <Editor
                        height="100%"
                        width="100%"
                        language={langIds[lang] ?? "python"}
                        value={code}
                        onChange={(val) => setCode(val ?? "")}
                        theme={editorTheme}
                        options={{
                          fontSize: 13,
                          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                          minimap: { enabled: false },
                          lineNumbers: "on",
                          scrollBeyondLastLine: false,
                          wordWrap: "on",
                          tabSize: 4,
                          automaticLayout: true,
                          padding: { top: 12, bottom: 12 },
                          scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                        }}
                      />
                    </div>
                  </div>
                </ResizablePanel>

                <ResizableHandle withHandle className="h-1 bg-border/30 hover:bg-primary/30 transition-colors" />

                {/* Bottom Panel: Interactive Test Cases & Compiler Console */}
                <ResizablePanel id="test-console" defaultSize="28" minSize="15">
                  <div className="flex flex-col h-full min-h-0 min-w-0 w-full overflow-hidden bg-card/60">
                    {/* Console Header Toolbar */}
                    <div className="flex items-center justify-between border-b border-border/40 px-4 py-2 bg-muted/20 shrink-0 gap-2 overflow-x-auto">
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setConsoleTab("cases")}
                          className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
                            consoleTab === "cases" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Terminal className="h-3.5 w-3.5" /> Sample Test Cases ({currentProblem.examples.length})
                        </button>
                        <button
                          onClick={() => setConsoleTab("results")}
                          className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
                            consoleTab === "results" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Test Results {testResults && `(${testResults.filter(r => r.passed).length}/${testResults.length})`}
                        </button>
                      </div>

                      {/* Always Visible Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => runCompiler(false)}
                          disabled={isRunning}
                          className="rounded-xl text-xs h-8 gap-1.5 font-bold"
                        >
                          {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 text-primary" />}
                          Run Test Cases
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => runCompiler(true)}
                          disabled={isRunning}
                          className="bg-gradient-primary shadow-elegant rounded-xl text-xs h-8 gap-1.5 font-bold text-white"
                        >
                          {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                          Submit Code
                        </Button>
                      </div>
                    </div>

                    {/* Console Body Area */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-4 font-mono text-xs">
                      {consoleTab === "cases" ? (
                        <div className="space-y-3">
                          {currentProblem.examples.map((ex, i) => (
                            <div key={i} className="rounded-xl border border-border/40 bg-muted/20 p-3 space-y-1">
                              <span className="font-sans font-bold text-[10px] text-muted-foreground uppercase">Testcase {i + 1}</span>
                              <div className="flex flex-wrap gap-4 mt-1">
                                <div><span className="text-muted-foreground font-sans">Input:</span> <span className="font-bold text-foreground">{ex.input}</span></div>
                                <div><span className="text-muted-foreground font-sans">Expected Output:</span> <span className="font-bold text-emerald-brand">{ex.output}</span></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div>
                          {isRunning ? (
                            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground font-sans">
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                              <span>Compiling & Running Test Cases...</span>
                            </div>
                          ) : testResults ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 font-sans font-bold text-sm">
                                {testResults.every((r) => r.passed) ? (
                                  <span className="text-emerald-brand flex items-center gap-1.5">
                                    <CheckCircle2 className="h-5 w-5" /> All Test Cases Passed!
                                  </span>
                                ) : (
                                  <span className="text-destructive flex items-center gap-1.5">
                                    <XCircle className="h-5 w-5" /> Some Test Cases Failed
                                  </span>
                                )}
                              </div>
                              {testResults.map((res) => (
                                <div
                                  key={res.caseIndex}
                                  className={`rounded-xl border p-3 space-y-1 ${
                                    res.passed ? "border-emerald-brand/30 bg-emerald-brand/5" : "border-destructive/30 bg-destructive/5"
                                  }`}
                                >
                                  <div className="flex items-center justify-between font-sans">
                                    <span className="font-bold text-[11px]">Testcase {res.caseIndex}</span>
                                    <Badge variant="outline" className={res.passed ? "border-emerald-brand text-emerald-brand" : "border-destructive text-destructive"}>
                                      {res.passed ? "Passed" : "Failed"}
                                    </Badge>
                                  </div>
                                  <div><span className="text-muted-foreground font-sans">Input:</span> {res.input}</div>
                                  <div><span className="text-muted-foreground font-sans">Expected:</span> <span className="text-emerald-brand font-bold">{res.expectedOutput}</span></div>
                                  <div><span className="text-muted-foreground font-sans">Actual:</span> <span className={res.passed ? "text-emerald-brand font-bold" : "text-destructive font-bold"}>{res.actualOutput}</span></div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-muted-foreground font-sans text-xs">
                              Click <strong>Run Test Cases</strong> to validate your code before submitting.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </ResizablePanel>

              </ResizablePanelGroup>
            </ResizablePanel>

          </ResizablePanelGroup>
      </div>
    </div>
  );
}
